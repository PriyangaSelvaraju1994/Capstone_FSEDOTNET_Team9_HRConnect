using FluentValidation;
using HRConnect.API.DTOs;

namespace HRConnect.API.Validators;

public class UpdateLeaveStatusValidator
    : AbstractValidator<UpdateLeaveStatusDto>
{
    public UpdateLeaveStatusValidator()
    {
        RuleFor(x => x.Status)
            .NotEmpty()
            .WithMessage("Status is required");
    }
}