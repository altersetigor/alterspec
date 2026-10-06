# Personas and roles

<!--
Three separate concepts:
- Persona (PER-*): who the person is, their goals and pain points. Narrative.
- Role (ROLE-*): an access-bearing identity. Capabilities grant roles a permission scope.
- Permission scope: own | team | org | all — set per capability in its front-matter.

Each item is a `## <ID> <Title>` heading followed by a yaml block, then prose.
-->

# Personas

## PER-{{persona}} {{persona_title}}

```yaml
id: PER-{{persona}}
title: "{{persona_title}}"
roles: [{{persona_roles}}]
```

**Goals:** <!-- what this person wants to achieve -->

**Pain points:** <!-- what gets in their way today -->

# Roles

## ROLE-{{role}} {{role_title}}

```yaml
id: ROLE-{{role}}
title: "{{role_title}}"
```

<!-- What this role is responsible for. Scopes are granted per capability, not here. -->
