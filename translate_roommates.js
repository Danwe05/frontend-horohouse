const fs = require('fs');

const targetFile = 'd:\\Reserved\\projects\\horohouse\\web\\client\\app\\students\\roommates\\page.tsx';
let content = fs.readFileSync(targetFile, 'utf8');

content = content.replace(
  `import {
  Select,`,
  `import { useLanguage } from '@/contexts/LanguageContext';
import {
  Select,`
);

content = content.replace(
  `const studentCtx = useStudentMode();`,
  `const studentCtx = useStudentMode();
  const { t } = useLanguage();
  const _t = t as any;
  const s = _t.students?.roommates || {};`
);

// handleToggleActive
content = content.replace(
  `toast.success('Profile paused — you are no longer visible in the pool.');`,
  `toast.success(s.profilePaused || 'Profile paused — you are no longer visible in the pool.');`
);
content = content.replace(
  `toast.success('Profile reactivated — you are visible again.');`,
  `toast.success(s.profileReactivated || 'Profile reactivated — you are visible again.');`
);
content = content.replace(
  `toast.error(err?.response?.data?.message || 'Action failed.');`,
  `toast.error(err?.response?.data?.message || s.actionFailed || 'Action failed.');`
);

// Not a student
content = content.replace(
  `<h2 className="text-xl font-bold text-slate-800 mb-2">Students only</h2>`,
  `<h2 className="text-xl font-bold text-slate-800 mb-2">{s.studentsOnly || 'Students only'}</h2>`
);
content = content.replace(
  `Create a student profile to access the roommate matching pool.`,
  `{s.studentsOnlyDesc || 'Create a student profile to access the roommate matching pool.'}`
);
content = content.replace(
  `Create student profile</Button>`,
  `{s.createStudentProfile || 'Create student profile'}</Button>`
);

// Not verified
content = content.replace(
  `<h2 className="text-xl font-bold text-slate-800 mb-2">Verify your student ID first</h2>`,
  `<h2 className="text-xl font-bold text-slate-800 mb-2">{s.verifyIdFirst || 'Verify your student ID first'}</h2>`
);
content = content.replace(
  `{verificationStatus === 'pending'
              ? "Your ID is under review. You'll get access within 24 hours."
              : 'Upload your university ID to join the roommate pool.'}`,
  `{verificationStatus === 'pending'
              ? (s.idUnderReview || "Your ID is under review. You'll get access within 24 hours.")
              : (s.uploadIdToJoin || 'Upload your university ID to join the roommate pool.')}`
);
content = content.replace(
  `Upload student ID
              </Button>`,
  `{s.uploadStudentId || 'Upload student ID'}
              </Button>`
);

// Hero Section
content = content.replace(
  `Roommate matching
                </div>`,
  `{s.roommateMatching || 'Roommate matching'}
                </div>`
);
content = content.replace(
  `Find your<br />
                  <span className="text-blue-200">Perfect match.</span>`,
  `{s.findYour || 'Find your'}<br />
                  <span className="text-blue-200">{s.perfectMatch || 'Perfect match.'}</span>`
);
content = content.replace(
  `Matched by sleep schedule, cleanliness, and vibes.
                  When both of you like each other, a chat opens instantly.`,
  `{s.matchedDesc || 'Matched by sleep schedule, cleanliness, and vibes. When both of you like each other, a chat opens instantly.'}`
);

// My profile status card
content = content.replace(
  `{myProfile.isActive ? 'Profile Active' : 'Profile Paused'}`,
  `{myProfile.isActive ? (s.profileActive || 'Profile Active') : (s.profilePausedStatus || 'Profile Paused')}`
);
content = content.replace(
  `>
                            Edit Profile
                          </button>`,
  `>
                            {s.editProfile || 'Edit Profile'}
                          </button>`
);
content = content.replace(
  `{myProfile.mode === 'have_room' ? 'Have a room' : 'Looking for a room'}`,
  `{myProfile.mode === 'have_room' ? (s.haveRoom || 'Have a room') : (s.lookForRoom || 'Looking for a room')}`
);
content = content.replace(
  `<p className="text-sm font-black uppercase tracking-widest mb-1 opacity-60">Join the pool</p>`,
  `<p className="text-sm font-black uppercase tracking-widest mb-1 opacity-60">{s.joinPool || 'Join the pool'}</p>`
);
content = content.replace(
  `<p className="text-xl font-black text-slate-900 leading-tight">Appear in searches & find matches.</p>`,
  `<p className="text-xl font-black text-slate-900 leading-tight">{s.appearInSearches || 'Appear in searches & find matches.'}</p>`
);
content = content.replace(
  `Create profile
                      </Button>`,
  `{s.createProfile || 'Create profile'}
                      </Button>`
);
content = content.replace(
  `<p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-1">Featured Match</p>`,
  `<p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-1">{s.featuredMatch || 'Featured Match'}</p>`
);
content = content.replace(
  `<p className="text-slate-900 font-black text-base uppercase tracking-tight">The Perfect Suite</p>`,
  `<p className="text-slate-900 font-black text-base uppercase tracking-tight">{s.perfectSuite || 'The Perfect Suite'}</p>`
);

// Tabs
content = content.replace(
  `label: 'Browse'`,
  `label: s.browse || 'Browse'`
);
content = content.replace(
  `label: 'Matches'`,
  `label: s.matches || 'Matches'`
);

// Filter chips
content = content.replace(
  `{modeFilter === 'have_room' ? 'Has Room' : 'Needs Room'}`,
  `{modeFilter === 'have_room' ? (s.hasRoom || 'Has Room') : (s.needsRoom || 'Needs Room')}`
);
content = content.replace(
  `Max {maxBudget/1000}K`,
  `{s.maxLabel || 'Max'} {maxBudget/1000}K`
);

// Select placeholders
content = content.replace(
  `<SelectValue placeholder="All modes" />`,
  `<SelectValue placeholder={s.allModes || 'All modes'} />`
);
content = content.replace(
  `className="text-xs font-bold rounded-xl cursor-pointer py-2.5">All modes</SelectItem>`,
  `className="text-xs font-bold rounded-xl cursor-pointer py-2.5">{s.allModes || 'All modes'}</SelectItem>`
);
content = content.replace(
  `className="text-xs font-bold rounded-xl cursor-pointer py-2.5">Needs a room</SelectItem>`,
  `className="text-xs font-bold rounded-xl cursor-pointer py-2.5">{s.needsRoom || 'Needs a room'}</SelectItem>`
);
content = content.replace(
  `className="text-xs font-bold rounded-xl cursor-pointer py-2.5">Has a room</SelectItem>`,
  `className="text-xs font-bold rounded-xl cursor-pointer py-2.5">{s.hasRoom || 'Has a room'}</SelectItem>`
);

content = content.replace(
  `<SelectValue placeholder="Any budget" />`,
  `<SelectValue placeholder={s.anyBudget || 'Any budget'} />`
);
content = content.replace(
  `className="text-xs font-bold rounded-xl cursor-pointer py-2.5">Any budget</SelectItem>`,
  `className="text-xs font-bold rounded-xl cursor-pointer py-2.5">{s.anyBudget || 'Any budget'}</SelectItem>`
);
content = content.replace(
  `className="text-xs font-bold rounded-xl cursor-pointer py-2.5">Max 30K</SelectItem>`,
  `className="text-xs font-bold rounded-xl cursor-pointer py-2.5">{s.max30k || 'Max 30K'}</SelectItem>`
);
content = content.replace(
  `className="text-xs font-bold rounded-xl cursor-pointer py-2.5">Max 50K</SelectItem>`,
  `className="text-xs font-bold rounded-xl cursor-pointer py-2.5">{s.max50k || 'Max 50K'}</SelectItem>`
);
content = content.replace(
  `className="text-xs font-bold rounded-xl cursor-pointer py-2.5">Max 75K</SelectItem>`,
  `className="text-xs font-bold rounded-xl cursor-pointer py-2.5">{s.max75k || 'Max 75K'}</SelectItem>`
);
content = content.replace(
  `className="text-xs font-bold rounded-xl cursor-pointer py-2.5">Max 100K</SelectItem>`,
  `className="text-xs font-bold rounded-xl cursor-pointer py-2.5">{s.max100k || 'Max 100K'}</SelectItem>`
);

// Subheaders
content = content.replace(
  `{tab === 'browse' ? 'Available Roommates' : 'Your Matching Pool'}`,
  `{tab === 'browse' ? (s.availableRoommates || 'Available Roommates') : (s.yourMatchingPool || 'Your Matching Pool')}`
);
content = content.replace(
  `{total} active profiles tracking`,
  `{total} {s.activeTracking || 'active profiles tracking'}`
);
content = content.replace(
  `>
                Clear Filters
              </button>`,
  `>
                {s.clearFilters || 'Clear Filters'}
              </button>`
);

// Empty state
content = content.replace(
  `<h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">No Roommates found</h3>`,
  `<h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">{s.noRoommatesFound || 'No Roommates found'}</h3>`
);
content = content.replace(
  `We couldn't find any profiles matching your current filters. Try adjusting your preferences.`,
  `{s.noProfilesDesc || "We couldn't find any profiles matching your current filters. Try adjusting your preferences."}`
);
content = content.replace(
  `Reset all filters
                </button>`,
  `{s.resetAllFilters || 'Reset all filters'}
                </button>`
);

// Pagination
content = content.replace(
  `<ChevronLeft className="w-4 h-4 mr-2" /> Previous`,
  `<ChevronLeft className="w-4 h-4 mr-2" /> {s.previous || 'Previous'}`
);
content = content.replace(
  `Next <ChevronRight className="w-4 h-4 ml-2" />`,
  `{s.next || 'Next'} <ChevronRight className="w-4 h-4 ml-2" />`
);

// Match Tab
content = content.replace(
  `<p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading matching pool...</p>`,
  `<p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.loadingMatches || 'Loading matching pool...'}</p>`
);

fs.writeFileSync(targetFile, content);
console.log('Roommates page translated.');
