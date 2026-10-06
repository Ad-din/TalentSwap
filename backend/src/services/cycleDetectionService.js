/**
 * Multi-person skill exchange cycle detection.
 *
 * Builds a directed graph where an edge (U -> V) means "U wants to learn a
 * skill that V teaches (with a compatible skill match)". A cycle of length
 * >= 3 in this graph represents a closed exchange loop, e.g.
 *   A teaches Python, wants UI/UX
 *   B teaches UI/UX, wants Photography
 *   C teaches Photography, wants Python
 *   => A -> B -> C -> A
 *
 * This is presented to users as a *recommendation*, not executed
 * automatically - per spec, no automatic multi-party transactions in the MVP.
 */

const MAX_CYCLE_LENGTH = 6; // keep search space bounded for an MVP

/**
 * @param {Object[]} nodes - [{ userId, teachSkillIds: Set, learnSkillIds: Set }]
 * @param {Function} isCompatible - (teachSkillId, learnSkillId) => boolean
 * @returns {string[][]} list of cycles, each an ordered array of userIds
 */
function findExchangeCycles(nodes, isCompatible) {
  // Build adjacency: edge U -> V if V teaches something U wants to learn.
  const adjacency = new Map(nodes.map((n) => [n.userId, []]));

  for (const u of nodes) {
    for (const v of nodes) {
      if (u.userId === v.userId) continue;
      const hasEdge = [...u.learnSkillIds].some((learnId) =>
        [...v.teachSkillIds].some((teachId) => isCompatible(teachId, learnId))
      );
      if (hasEdge) adjacency.get(u.userId).push(v.userId);
    }
  }

  const cycles = [];
  const seenCycleKeys = new Set();

  function dfs(start, current, path, visited) {
    if (path.length > MAX_CYCLE_LENGTH) return;

    for (const next of adjacency.get(current) || []) {
      if (next === start && path.length >= 3) {
        const key = [...path].sort().join('|');
        if (!seenCycleKeys.has(key)) {
          seenCycleKeys.add(key);
          cycles.push([...path]);
        }
      } else if (!visited.has(next)) {
        visited.add(next);
        dfs(start, next, [...path, next], visited);
        visited.delete(next);
      }
    }
  }

  for (const node of nodes) {
    dfs(node.userId, node.userId, [node.userId], new Set([node.userId]));
  }

  return cycles;
}

module.exports = { findExchangeCycles, MAX_CYCLE_LENGTH };
