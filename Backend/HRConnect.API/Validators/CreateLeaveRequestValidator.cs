using FluentValidation;
using HRConnect.API.DTOs;

namespace HRConnect.API.Validators;

public class CreateLeaveRequestValidator
    : AbstractValidator<CreateLeaveRequestDto>
{
    public CreateLeaveRequestValidator()
    {
        RuleFor(x => x.EmployeeId)
            .GreaterThan(0)
            .WithMessage("Employee Id is required");

        RuleFor(x => x.LeaveType)
            .NotEmpty()
            .WithMessage("Leave Type is required");

        RuleFor(x => x.Reason)
            .NotEmpty()
            .WithMessage("Reason is required");

        RuleFor(x => x.StartDate)
            .LessThanOrEqualTo(x => x.EndDate)
            .WithMessage(
                "Start Date cannot be greater than End Date");
    }
}