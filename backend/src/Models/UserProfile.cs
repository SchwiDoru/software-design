
using System.ComponentModel.DataAnnotations;

namespace Backend.Models;

public class UserProfile
{
    required public string Name {get; set;}
    [Key]
    required public string Email {get; set;}
    public string? PhoneNumber {get; set;}
}