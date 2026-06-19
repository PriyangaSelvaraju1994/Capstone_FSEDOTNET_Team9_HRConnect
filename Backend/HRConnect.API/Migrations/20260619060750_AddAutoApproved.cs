using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HRConnect.API.Migrations
{
    /// <inheritdoc />
    public partial class AddAutoApproved : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsAutoApproved",
                table: "LeaveRequests",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsAutoApproved",
                table: "LeaveRequests");
        }
    }
}
