using System.Text.Json;
using Backend.Constants;
using Microsoft.SemanticKernel;

namespace Backend.Services.AI;

public class PriorityClassifier: IPriorityClassifier
{
    private readonly Kernel _kernel;

    public PriorityClassifier(Kernel kernel)
    {
        _kernel = kernel;

    }

public async Task<PriorityLevel> ClassifyAsync(string? description)
{
    var prompt = @"
Classify the hospital patients queue entry 
description into one of these priority levels:

Low
Medium
High

Rules:
- Return ONLY one word
- No punctuation
- No explanation
- if description is null or empty return Low priority

Patient Description:
{{$description}}
";

    var result = await _kernel.InvokePromptAsync(prompt,
        new() { ["description"] = description });

    var value = result.ToString().Trim().ToLower();

    return value switch
    {
        "low" => PriorityLevel.Low,
        "medium" => PriorityLevel.Medium,
        "high" => PriorityLevel.High,
        _ => PriorityLevel.Medium // safe fallback
    };
}}