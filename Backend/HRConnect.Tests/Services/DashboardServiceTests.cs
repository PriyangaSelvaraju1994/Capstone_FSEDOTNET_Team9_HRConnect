using HRConnect.API.Data;
using HRConnect.API.Entities;
using HRConnect.API.Services.Implementations;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace HRConnect.Tests.Services;

public class DashboardServiceTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly DashboardService _service;

    public DashboardServiceTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _context = new ApplicationDbContext(options);
        _service = new DashboardService(_context);
    }

    #region GetDashboardSummaryAsync Tests

    [Fact]
    public async Task GetDashboardSummaryAsync_ReturnsCorrectCounts_WhenDataExists()
    {
        // Arrange
        var user1 = new User
        {
            Id = 1,
            FullName = "John Doe",
            Email = "john@test.com",
            PasswordHash = "hash",
            IsAdmin = false
        };
        var user2 = new User
        {
            Id = 2,
            FullName = "Jane Smith",
            Email = "jane@test.com",
            PasswordHash = "hash",
            IsAdmin = false
        };

        _context.Users.AddRange(user1, user2);

        var employee1 = new Employee
        {
            Id = 1,
            UserId = 1,
            Department = "IT",
            Designation = "Developer",
            IsActive = true,
            JoiningDate = DateTime.Today.AddYears(-1)
        };

        var employee2 = new Employee
        {
            Id = 2,
            UserId = 2,
            Department = "HR",
            Designation = "Manager",
            IsActive = true,
            JoiningDate = DateTime.Today.AddYears(-2)
        };

        _context.Employees.AddRange(employee1, employee2);

        var pendingLeave = new LeaveRequest
        {
            Id = 1,
            EmployeeId = 1,
            LeaveType = "Casual",
            StartDate = DateTime.Today.AddDays(5),
            EndDate = DateTime.Today.AddDays(7),
            Status = "Pending",
            Reason = "Personal",
            CreatedDate = DateTime.UtcNow
        };

        var approvedThisMonth = new LeaveRequest
        {
            Id = 2,
            EmployeeId = 2,
            LeaveType = "Sick",
            StartDate = new DateTime(DateTime.Now.Year, DateTime.Now.Month, 15),
            EndDate = new DateTime(DateTime.Now.Year, DateTime.Now.Month, 17),
            Status = "Approved",
            Reason = "Medical",
            CreatedDate = DateTime.UtcNow.AddDays(-5)
        };

        var onLeaveToday = new LeaveRequest
        {
            Id = 3,
            EmployeeId = 1,
            LeaveType = "Casual",
            StartDate = DateTime.Today.AddDays(-1),
            EndDate = DateTime.Today.AddDays(1),
            Status = "Approved",
            Reason = "Vacation",
            CreatedDate = DateTime.UtcNow.AddDays(-2)
        };

        _context.LeaveRequests.AddRange(pendingLeave, approvedThisMonth, onLeaveToday);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetDashboardSummaryAsync();

        // Assert
        Assert.NotNull(result);
        Assert.Equal(1, result.PendingCount); // 1 pending leave
        Assert.Equal(2, result.ApprovedThisMonth); // 2 approved this month
        Assert.Equal(2, result.ActiveEmployees); // 2 active employees
        Assert.Equal(1, result.OnLeaveToday); // 1 on leave today
    }

    //[Fact]
    //public async Task GetDashboardSummaryAsync_ReturnsZeroCounts_WhenNoData()
    //{
    //    // Act
    //    var result = await _service.GetDashboardSummaryAsync();

    //    // Assert
    //    Assert.NotNull(result);
    //    Assert.Equal(0, result.PendingCount);
    //    Assert.Equal(0, result.ApprovedThisMonth);
    //    Assert.Equal(0, result.ActiveEmployees);
    //    Assert.Equal(0, result.OnLeaveToday);
    //}

    //[Fact]
    //public async Task GetDashboardSummaryAsync_CountsOnlyPendingLeaves()
    //{
    //    // Arrange
    //    var user = new User
    //    {
    //        Id = 1,
    //        FullName = "Test User",
    //        Email = "test@test.com",
    //        PasswordHash = "hash",
    //        IsAdmin = false
    //    };
    //    _context.Users.Add(user);

    //    var employee = new Employee
    //    {
    //        Id = 1,
    //        UserId = 1,
    //        Department = "IT",
    //        Designation = "Dev",
    //        IsActive = true,
    //        JoiningDate = DateTime.Today
    //    };
    //    _context.Employees.Add(employee);

    //    var pendingLeave1 = new LeaveRequest
    //    {
    //        Id = 1,
    //        EmployeeId = 1,
    //        Status = "Pending",
    //        StartDate = DateTime.Today,
    //        EndDate = DateTime.Today,
    //        LeaveType = "Casual",
    //        Reason = "Test"
    //    };

    //    var pendingLeave2 = new LeaveRequest
    //    {
    //        Id = 2,
    //        EmployeeId = 1,
    //        Status = "Pending",
    //        StartDate = DateTime.Today,
    //        EndDate = DateTime.Today,
    //        LeaveType = "Sick",
    //        Reason = "Test"
    //    };

    //    var approvedLeave = new LeaveRequest
    //    {
    //        Id = 3,
    //        EmployeeId = 1,
    //        Status = "Approved",
    //        StartDate = DateTime.Today,
    //        EndDate = DateTime.Today,
    //        LeaveType = "Casual",
    //        Reason = "Test"
    //    };

    //    _context.LeaveRequests.AddRange(pendingLeave1, pendingLeave2, approvedLeave);
    //    await _context.SaveChangesAsync();

    //    // Act
    //    var result = await _service.GetDashboardSummaryAsync();

    //    // Assert
    //    Assert.Equal(2, result.PendingCount); // Only 2 pending leaves
    //}

    #endregion

    #region GetRecentActivitiesAsync Tests

    [Fact]
    public async Task GetRecentActivitiesAsync_ReturnsTop5Activities_OrderedByCreatedDate()
    {
        // Arrange
        var user = new User
        {
            Id = 1,
            FullName = "John Doe",
            Email = "john@test.com",
            PasswordHash = "hash",
            IsAdmin = false
        };
        _context.Users.Add(user);

        var employee = new Employee
        {
            Id = 1,
            UserId = 1,
            Department = "IT",
            Designation = "Developer",
            IsActive = true,
            JoiningDate = DateTime.Today
        };
        _context.Employees.Add(employee);

        // Add 7 leave requests
        for (int i = 1; i <= 7; i++)
        {
            _context.LeaveRequests.Add(new LeaveRequest
            {
                Id = i,
                EmployeeId = 1,
                LeaveType = $"Type{i}",
                StartDate = DateTime.Today.AddDays(i),
                EndDate = DateTime.Today.AddDays(i + 1),
                Status = "Pending",
                Reason = $"Reason {i}",
                CreatedDate = DateTime.UtcNow.AddHours(-i)
            });
        }

        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetRecentActivitiesAsync();

        // Assert
        Assert.NotNull(result);
        Assert.Equal(5, result.Count); // Should return only top 5
        Assert.Equal("Type1", result[0].LeaveType); // Most recent first
        Assert.Equal("Type5", result[4].LeaveType); // 5th most recent
    }

    [Fact]
    public async Task GetRecentActivitiesAsync_ReturnsEmptyList_WhenNoLeaves()
    {
        // Act
        var result = await _service.GetRecentActivitiesAsync();

        // Assert
        Assert.NotNull(result);
        Assert.Empty(result);
    }

    [Fact]
    public async Task GetRecentActivitiesAsync_PopulatesAllFields_Correctly()
    {
        // Arrange
        var user = new User
        {
            Id = 1,
            FullName = "John Doe",
            Email = "john@test.com",
            PasswordHash = "hash",
            IsAdmin = false
        };
        _context.Users.Add(user);

        var employee = new Employee
        {
            Id = 1,
            UserId = 1,
            Department = "IT",
            Designation = "Developer",
            IsActive = true,
            JoiningDate = DateTime.Today
        };
        _context.Employees.Add(employee);

        var startDate = DateTime.Today.AddDays(5);
        var endDate = DateTime.Today.AddDays(7);
        var createdDate = DateTime.UtcNow.AddHours(-1);

        var leaveRequest = new LeaveRequest
        {
            Id = 1,
            EmployeeId = 1,
            LeaveType = "Casual",
            StartDate = startDate,
            EndDate = endDate,
            Status = "Pending",
            Reason = "Personal work",
            CreatedDate = createdDate
        };

        _context.LeaveRequests.Add(leaveRequest);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetRecentActivitiesAsync();

        // Assert
        Assert.Single(result);
        var activity = result[0];
        Assert.Equal(1, activity.Id);
        Assert.Equal(1, activity.ActorId);
        Assert.Equal("John Doe", activity.ActorName);
        Assert.Equal("JD", activity.ActorInitials);
        Assert.Equal("requested", activity.Action);
        Assert.Equal("Casual", activity.LeaveType);
        Assert.Equal(3, activity.Days); // 7 - 5 + 1 = 3 days
        Assert.Equal(startDate, activity.StartDate);
        Assert.Equal(endDate, activity.EndDate);
        Assert.Equal("Pending", activity.Status);
    }

    [Fact]
    public async Task GetRecentActivitiesAsync_CalculatesInitials_Correctly()
    {
        // Arrange
        var testCases = new[]
        {
            ("John Doe", "JD"),
            ("Mary Jane Watson", "MJW"),
            ("SingleName", "S"),
            ("", "")
        };

        int userId = 1;
        int employeeId = 1;
        int leaveId = 1;

        foreach (var (fullName, expectedInitials) in testCases)
        {
            var user = new User
            {
                Id = userId++,
                FullName = fullName,
                Email = $"user{userId}@test.com",
                PasswordHash = "hash",
                IsAdmin = false
            };
            _context.Users.Add(user);

            var employee = new Employee
            {
                Id = employeeId++,
                UserId = user.Id,
                Department = "IT",
                Designation = "Dev",
                IsActive = true,
                JoiningDate = DateTime.Today
            };
            _context.Employees.Add(employee);

            var leaveRequest = new LeaveRequest
            {
                Id = leaveId++,
                EmployeeId = employee.Id,
                LeaveType = "Casual",
                StartDate = DateTime.Today,
                EndDate = DateTime.Today,
                Status = "Pending",
                Reason = "Test",
                CreatedDate = DateTime.UtcNow.AddHours(-leaveId)
            };
            _context.LeaveRequests.Add(leaveRequest);
        }

        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetRecentActivitiesAsync();

        // Assert
        Assert.Equal(4, result.Count);
        Assert.Equal("JD", result[0].ActorInitials);
        Assert.Equal("MJW", result[1].ActorInitials);
        Assert.Equal("S", result[2].ActorInitials);
        Assert.Equal("", result[3].ActorInitials);
    }

    #endregion

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }
}