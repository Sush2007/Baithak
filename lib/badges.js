export const BADGES = [
  // Core Honor Badges (Based on Lifetime HP)
  { 
    id: 'newcomer', 
    name: 'Newcomer', 
    description: 'Just starting the journey', 
    requirement: 0, 
    type: 'honor', 
    imageUrl: 'https://cdn.baithakpe.com/badges/newcomer.png' 
  },
  { 
    id: 'contributor', 
    name: 'Contributor', 
    description: 'Earned 250 Honor Points', 
    requirement: 250, 
    type: 'honor', 
    imageUrl: 'https://cdn.baithakpe.com/badges/contributor.png' 
  },
  { 
    id: 'problem_solver', 
    name: 'Problem Solver', 
    description: 'Earned 500 Honor Points', 
    requirement: 500, 
    type: 'honor', 
    imageUrl: 'https://cdn.baithakpe.com/badges/problem_solver.png' 
  },
  { 
    id: 'knowledge_builder', 
    name: 'Knowledge Builder', 
    description: 'Earned 1,000 Honor Points', 
    requirement: 1000, 
    type: 'honor', 
    imageUrl: 'https://cdn.baithakpe.com/badges/knowledge_builder.png' 
  },
  { 
    id: 'baithak_veteran', 
    name: 'Baithak Veteran', 
    description: 'Earned 2,500 Honor Points', 
    requirement: 2500, 
    type: 'honor', 
    imageUrl: 'https://cdn.baithakpe.com/badges/baithak_veteran.png' 
  },
  { 
    id: 'community_pillar', 
    name: 'Community Pillar', 
    description: 'Earned 5,000 Honor Points', 
    requirement: 5000, 
    type: 'honor', 
    imageUrl: 'https://cdn.baithakpe.com/badges/community_pillar.png' 
  },
  
  // Special Achievement Badges
  { 
    id: 'consistent_helper', 
    name: 'Consistent Helper', 
    description: 'Achieved a 30-day contribution streak', 
    type: 'special', 
    imageUrl: 'https://cdn.baithakpe.com/badges/consistent_helper.png' 
  },
  { 
    id: 'top_answerer', 
    name: 'Top Answerer', 
    description: 'Provided 25 Best Answers', 
    type: 'special', 
    imageUrl: 'https://cdn.baithakpe.com/badges/top_answerer.png' 
  },
  { 
    id: 'knowledge_keeper', 
    name: 'Knowledge Keeper', 
    description: 'Provided 100 helpful answers', 
    type: 'special', 
    imageUrl: 'https://cdn.baithakpe.com/badges/knowledge_keeper.png' 
  },
  { 
    id: 'community_helper', 
    name: '🤝 Community Helper', 
    description: 'Achieved 100 validated helpful interactions', 
    type: 'special', 
    imageUrl: 'https://cdn.baithakpe.com/badges/community_helper.png' 
  }
];

// Helper to determine the user's current Honor Level badge
export function getCurrentHonorBadge(lifetimeHP) {
  const honorBadges = BADGES.filter(b => b.type === 'honor').sort((a, b) => b.requirement - a.requirement);
  return honorBadges.find(b => lifetimeHP >= b.requirement) || honorBadges[honorBadges.length - 1];
}

// Helper to determine the next Honor Level badge
export function getNextHonorBadge(lifetimeHP) {
  const honorBadges = BADGES.filter(b => b.type === 'honor').sort((a, b) => a.requirement - b.requirement);
  return honorBadges.find(b => lifetimeHP < b.requirement) || null;
}
