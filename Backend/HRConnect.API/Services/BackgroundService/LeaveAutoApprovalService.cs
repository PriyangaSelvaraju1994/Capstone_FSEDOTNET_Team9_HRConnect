using HRConnect.API.Data;
using HRConnect.API.Entities;
using Microsoft.EntityFrameworkCore;

public class LeaveAutoApprovalService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<LeaveAutoApprovalService> _logger;
    public LeaveAutoApprovalService(
        IServiceScopeFactory scopeFactory,
        ILogger<LeaveAutoApprovalService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        Console.WriteLine("LeaveAutoApprovalService Started");
       
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await AutoApproveLeaves(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while auto-approving leaves");
            }

            await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
        }
    }

    private async Task AutoApproveLeaves(CancellationToken stoppingToken)
    {
         using var scope = _scopeFactory.CreateScope();

        var context = scope.ServiceProvider
            .GetRequiredService<ApplicationDbContext>();

        var emailService = scope.ServiceProvider
            .GetRequiredService<IEmailService>();

        var thresholdDate = DateTime.UtcNow.AddHours(-72); // 72 hours ago

        var pendingLeaves = await context.LeaveRequests
            .Where(x =>
                x.Status == LeaveStatus.Pending.ToString() &&
                x.CreatedDate <= thresholdDate)
            .ToListAsync(stoppingToken);

        foreach (var leave in pendingLeaves)
        {
            leave.Status = LeaveStatus.Approved.ToString();
            leave.UpdatedDate = DateTime.UtcNow;
            leave.UpdatedBy = "System";
            leave.IsAutoApproved = true;             
        }
        
        if (pendingLeaves.Any())
        {
            await context.SaveChangesAsync(stoppingToken);
            // foreach (var leave in pendingLeaves)
            // {
            //     var user = await context.Employees
            //     .Include(e => e.User)
            //     .FirstOrDefaultAsync(e => e.Id == leave.EmployeeId);

            //     if (!string.IsNullOrWhiteSpace(user?.User?.Email))
            //     {
            //         await emailService.SendEmailAsync(
            //             user.User.Email,
            //             "Leave Auto-Approved",
            //             $"Hi {user.User.FullName},</br>Your leave request from {leave.StartDate} to {leave.EndDate} has been auto-approved due to lack of response from approver.</br>Best regards,</br>HRConnect Team");
            //     }
            // }
            _logger.LogInformation(
                "{Count} leaves auto-approved",
                pendingLeaves.Count);
        }
        
    }
}