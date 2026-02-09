# Behavior Trees

A modular and hierarchical way to build complex AI logic.

## Concepts
- **Root**: The starting point of the tree.
- **Composite Nodes**:
  - **Sequence**: Runs children until one fails. (AND logic)
  - **Selector**: Runs children until one succeeds. (OR logic)
- **Leaf Nodes**:
  - **Action**: Does something (e.g., "MoveToEnemy").
  - **Condition**: Checks something (e.g., "IsHealthLow?").

## Challenge
1. Design a Behavior Tree for a "Guard" NPC:
   - If player is visible -> Chase.
   - If player is not visible -> Patrol.
   - If health is low -> Retreat to base.
2. Implement this structure using a simple class-based approach in Python.
