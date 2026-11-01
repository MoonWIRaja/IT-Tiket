# Migrating old memory files

1. Keep a backup of the old instance.
2. Complete the root [setup wizard](../../../setup-wizard.md). In team mode, register each person's GitHub account.
3. In team mode, initialize the vault and have each person unlock it locally, then run `Login` with their own account and confirm their user ID and agent.
4. Review old profile and agent memory. Use `SaveMemory` to import confirmed, attributable facts.
5. Import old diary events with `SaveDiary` and include their original dates in the text. The helper also records the import timestamp. Use `SaveTopic` for reusable subject knowledge.
6. Verify sample facts with `Recall`. In team mode, imported project records are shared with all members who unlock the vault; review them before import.
7. Keep the backup until every owner has reviewed their imported data.

The helper does not bulk-import or silently delete old files. Resolve unclear ownership before importing.
