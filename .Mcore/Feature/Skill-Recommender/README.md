# Skill Recommender

The [MemoryCore skill recommender](SKILL.md) helps an AI find and compare skills. Its [integrated flow](Invoke-SkillFlow.ps1) then invokes the NVIDIA SkillSpector CLI on the exact candidate, saves a review, and verifies the reviewed files before installation. The scanner itself remains a separately installed dependency. This feature lives inside `.Mcore/Feature/` and is read on demand from MemoryCore rules; it is not automatically registered in every provider's native skill menu.

```powershell
.\.Mcore\Feature\Skill-Recommender\Invoke-SkillFlow.ps1 -Action Review -CandidatePath C:\path\to\candidate -Name useful-skill -Scope Team
# Inspect the returned report_file and candidate before proceeding.
.\.Mcore\Feature\Skill-Recommender\Invoke-SkillFlow.ps1 -Action Install -ReviewId <review_id> -ManualReviewComplete
```

Use `-Scope Personal` for the logged-in user's local skill. The scan report and staging copy stay under ignored `.Mcore/.runtime/`. The script never runs the candidate's code.

When testing or maintaining a blank template, run this flow on a separate temporary copy of `.Mcore`. Do not ship test review reports or staged copies in the template.
