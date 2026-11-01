# Topic Diary System

Reusable notes have a local cache in the selected agent's `topics.json`. In team mode, each new note also becomes an encrypted project event. Each topic has a stable ID and timestamped entries. IDs use lowercase letters, digits, and internal hyphens.

After `Login`, run `SaveTopic -TopicId <id> -Text "<verified note>"`. The helper creates the topic if needed and appends the entry. See [SKILL.md](SKILL.md).
