using HRConnect.API.Entities;
using Microsoft.EntityFrameworkCore;

namespace HRConnect.API.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(
        DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users { get; set; }

    public DbSet<Employee> Employees { get; set; }

    public DbSet<LeaveRequest> LeaveRequests { get; set; }

    public DbSet<LeaveBalance> LeaveBalances { get; set; }

    public DbSet<Holiday> Holidays { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Employee>()
            .HasOne(e => e.User)
            .WithOne(u => u.Employee)
            .HasForeignKey<Employee>(e => e.UserId);

        modelBuilder.Entity<LeaveRequest>()
            .HasOne(lr => lr.Employee)
            .WithMany(e => e.LeaveRequests)
            .HasForeignKey(lr => lr.EmployeeId);

        modelBuilder.Entity<LeaveBalance>()
            .HasOne(lb => lb.Employee)
            .WithMany(e => e.LeaveBalances)
            .HasForeignKey(lb => lb.EmployeeId);

        modelBuilder.Entity<Holiday>().HasData(
            new Holiday
            {
                Id = 1,
                HolidayName = "New Year's Day",
                HolidayDate = new DateTime(2026, 1, 1),
                Description = "New Year's Day"
            },
            new Holiday
            {
                Id = 2,
                HolidayName = "Republic Day",
                HolidayDate = new DateTime(2026, 1, 26),
                Description = "Republic Day"
            },
            new Holiday
            {
                Id = 3,
                HolidayName = "Independence Day",
                HolidayDate = new DateTime(2026, 8, 15),
                Description = "Independence Day"
            }
        );
    }
}