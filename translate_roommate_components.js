const fs = require('fs');
const path = require('path');

const dir = 'd:\\Reserved\\projects\\horohouse\\web\\client\\app\\students\\roommates\\components';

// --- RoommateCard ---
let rcPath = path.join(dir, 'RoommateCard.tsx');
let rcContent = fs.readFileSync(rcPath, 'utf8');

if (!rcContent.includes("useLanguage")) {
  rcContent = rcContent.replace(
    `import { Button } from '@/components/ui/button';`,
    `import { Button } from '@/components/ui/button';\nimport { useLanguage } from '@/contexts/LanguageContext';`
  );

  rcContent = rcContent.replace(
    `export function RoommateCard({ profile, index = 0, onInterestSent }: RoommateCardProps) {`,
    `export function RoommateCard({ profile, index = 0, onInterestSent }: RoommateCardProps) {
  const { t } = useLanguage();
  const _t = t as any;
  const s = _t.students?.roommates?.card || {};`
  );

  // Labels
  rcContent = rcContent.replace(/label: 'Early bird'/g, `label: s.earlyBird || 'Early bird'`);
  rcContent = rcContent.replace(/label: 'Night owl'/g, `label: s.nightOwl || 'Night owl'`);
  rcContent = rcContent.replace(/label: 'Flexible'/g, `label: s.flexible || 'Flexible'`);
  
  rcContent = rcContent.replace(/label: 'Very neat'/g, `label: s.veryNeat || 'Very neat'`);
  rcContent = rcContent.replace(/label: 'Neat'/g, `label: s.neat || 'Neat'`);
  rcContent = rcContent.replace(/label: 'Relaxed'/g, `label: s.relaxed || 'Relaxed'`);
  
  rcContent = rcContent.replace(/label: 'Introverted'/g, `label: s.introverted || 'Introverted'`);
  rcContent = rcContent.replace(/label: 'Balanced'/g, `label: s.balanced || 'Balanced'`);
  rcContent = rcContent.replace(/label: 'Social'/g, `label: s.social || 'Social'`);
  
  rcContent = rcContent.replace(/label: 'Studies at home'/g, `label: s.studiesHome || 'Studies at home'`);
  rcContent = rcContent.replace(/label: 'Studies at library'/g, `label: s.studiesLibrary || 'Studies at library'`);
  rcContent = rcContent.replace(/label: 'Mixed study'/g, `label: s.mixedStudy || 'Mixed study'`);

  // Toasts
  rcContent = rcContent.replace(
    `toast.success("It's a match! Check your messages to start chatting.");`,
    `toast.success(s.itsAMatch || "It's a match! Check your messages to start chatting.");`
  );
  rcContent = rcContent.replace(
    `toast.success(\`Interest sent to \${name}!\`);`,
    `toast.success(s.interestSent ? s.interestSent.replace('{name}', name) : \`Interest sent to \${name}!\`);`
  );
  rcContent = rcContent.replace(
    `toast.error(err?.response?.data?.message || 'Could not send interest. Try again.');`,
    `toast.error(err?.response?.data?.message || s.couldNotSend || 'Could not send interest. Try again.');`
  );

  // JSX texts
  rcContent = rcContent.replace(
    `{profile.mode === 'have_room' ? 'Owner' : 'Seeker'}`,
    `{profile.mode === 'have_room' ? (s.owner || 'Owner') : (s.seeker || 'Seeker')}`
  );
  rcContent = rcContent.replace(
    `<span className="text-[7px] font-black uppercase tracking-tighter mt-0.5">Match</span>`,
    `<span className="text-[7px] font-black uppercase tracking-tighter mt-0.5">{s.match || 'Match'}</span>`
  );
  rcContent = rcContent.replace(
    `<Cigarette className="w-3 h-3" /> Smoker`,
    `<Cigarette className="w-3 h-3" /> {s.smoker || 'Smoker'}`
  );
  rcContent = rcContent.replace(
    `Featured Residence`,
    `{s.featuredResidence || 'Featured Residence'}`
  );
  rcContent = rcContent.replace(
    `<span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Budget</span>`,
    `<span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.budget || 'Budget'}</span>`
  );
  rcContent = rcContent.replace(
    `In {formatDate(profile.moveInDate).split(' ')[0]}`,
    `{s.in || 'In'} {formatDate(profile.moveInDate).split(' ')[0]}`
  );

  rcContent = rcContent.replace(
    `Interested\n            </span>`,
    `{s.interested || 'Interested'}
            </span>`
  );
  rcContent = rcContent.replace(
    `Wait\n            </span>`,
    `{s.wait || 'Wait'}
            </span>`
  );
  rcContent = rcContent.replace(
    `Connect\n            </span>`,
    `{s.connect || 'Connect'}
            </span>`
  );

  fs.writeFileSync(rcPath, rcContent);
}

// --- MatchInbox ---
let miPath = path.join(dir, 'MatchInbox.tsx');
let miContent = fs.readFileSync(miPath, 'utf8');

if (!miContent.includes("useLanguage")) {
  miContent = miContent.replace(
    `import Link from 'next/link';`,
    `import Link from 'next/link';\nimport { useLanguage } from '@/contexts/LanguageContext';`
  );

  miContent = miContent.replace(
    `function MatchRow({`,
    `function MatchRow({
  match,
  currentUserId,
  onRefresh,
}: {
  match: Match;
  currentUserId: string;
  onRefresh: () => void;
}) {
  const { t } = useLanguage();
  const _t = t as any;
  const s = _t.students?.roommates?.inbox || {};`
  );
  // because MatchRow signature is spread over multiple lines:
  // We'll replace the existing signature carefully.
  miContent = miContent.replace(
    /function MatchRow\(\{[\s\S]*?\}\) \{/m,
    `function MatchRow({
  match,
  currentUserId,
  onRefresh,
}: {
  match: Match;
  currentUserId: string;
  onRefresh: () => void;
}) {
  const { t } = useLanguage();
  const _t = t as any;
  const s = _t.students?.roommates?.inbox || {};`
  );

  miContent = miContent.replace(
    `toast.success("It's a match! You can now chat.");`,
    `toast.success(s.matchSuccess || "It's a match! You can now chat.");`
  );
  miContent = miContent.replace(
    `toast.error(err?.response?.data?.message || 'Could not accept match.');`,
    `toast.error(err?.response?.data?.message || s.acceptError || 'Could not accept match.');`
  );
  miContent = miContent.replace(
    `toast.success('Match declined.');`,
    `toast.success(s.matchDeclined || 'Match declined.');`
  );
  miContent = miContent.replace(
    `toast.error(err?.response?.data?.message || 'Could not decline match.');`,
    `toast.error(err?.response?.data?.message || s.declineError || 'Could not decline match.');`
  );

  miContent = miContent.replace(
    `Chat\n            </Button>`,
    `{s.chat || 'Chat'}
            </Button>`
  );
  miContent = miContent.replace(
    `<><Check className="w-3.5 h-3.5 mr-1" />Accept</>`,
    `<><Check className="w-3.5 h-3.5 mr-1" />{s.accept || 'Accept'}</>`
  );
  miContent = miContent.replace(
    `<Clock className="w-3 h-3" />\n            Waiting\n          </span>`,
    `<Clock className="w-3 h-3" />
            {s.waiting || 'Waiting'}
          </span>`
  );

  miContent = miContent.replace(
    `export function MatchInbox({ matches, currentUserId, onRefresh }: MatchInboxProps) {`,
    `export function MatchInbox({ matches, currentUserId, onRefresh }: MatchInboxProps) {
  const { t } = useLanguage();
  const _t = t as any;
  const s = _t.students?.roommates?.inbox || {};`
  );

  miContent = miContent.replace(
    `No matches yet — express interest in profiles to get started.</p>`,
    `{s.noMatches || 'No matches yet — express interest in profiles to get started.'}</p>`
  );
  miContent = miContent.replace(
    `Confirmed matches ({matches.matched.length})`,
    `{s.confirmedMatches || 'Confirmed matches'} ({matches.matched.length})`
  );
  miContent = miContent.replace(
    `Pending ({matches.pending.length})`,
    `{s.pendingMatches || 'Pending'} ({matches.pending.length})`
  );

  fs.writeFileSync(miPath, miContent);
}

// --- RoommateProfileModal ---
let rmMPath = path.join(dir, 'RoommateProfileModal.tsx');
let rmMContent = fs.readFileSync(rmMPath, 'utf8');

if (!rmMContent.includes("useLanguage")) {
  rmMContent = rmMContent.replace(
    `import { motion } from 'framer-motion';`,
    `import { motion } from 'framer-motion';\nimport { useLanguage } from '@/contexts/LanguageContext';`
  );

  rmMContent = rmMContent.replace(
    `export function RoommateProfileModal({`,
    `export function RoommateProfileModal({
  open,
  onClose,
  onSuccess,
  existingProfile,
  campusCity,
}: RoommateProfileModalProps) {
  const { t } = useLanguage();
  const _t = t as any;
  const s = _t.students?.roommates?.modal || {};`
  );
  rmMContent = rmMContent.replace(
    /export function RoommateProfileModal\(\{[\s\S]*?\}\) \{/m,
    `export function RoommateProfileModal({
  open,
  onClose,
  onSuccess,
  existingProfile,
  campusCity,
}: RoommateProfileModalProps) {
  const { t } = useLanguage();
  const _t = t as any;
  const s = _t.students?.roommates?.modal || {};`
  );

  rmMContent = rmMContent.replace(
    `toast.success('Roommate profile updated.');`,
    `toast.success(s.profileUpdated || 'Roommate profile updated.');`
  );
  rmMContent = rmMContent.replace(
    `toast.success('Roommate profile created! You are now visible in the pool.');`,
    `toast.success(s.profileCreated || 'Roommate profile created! You are now visible in the pool.');`
  );
  rmMContent = rmMContent.replace(
    `toast.error(err?.response?.data?.message || 'Failed to save profile.');`,
    `toast.error(err?.response?.data?.message || s.saveError || 'Failed to save profile.');`
  );

  // JSX updates
  rmMContent = rmMContent.replace(
    `{isEdit ? 'Edit roommate profile' : 'Create roommate profile'}`,
    `{isEdit ? (s.editProfileTitle || 'Edit roommate profile') : (s.createProfileTitle || 'Create roommate profile')}`
  );
  rmMContent = rmMContent.replace(
    `Tell potential roommates about yourself so they can find you.`,
    `{s.modalDesc || 'Tell potential roommates about yourself so they can find you.'}`
  );
  rmMContent = rmMContent.replace(
    `What are you looking for?`,
    `{s.whatLookingFor || 'What are you looking for?'}`
  );
  rmMContent = rmMContent.replace(
    `label: 'I need a room', desc: 'Looking for a place to co-lease'`,
    `label: s.needRoom || 'I need a room', desc: s.needRoomDesc || 'Looking for a place to co-lease'`
  );
  rmMContent = rmMContent.replace(
    `label: 'I have a room', desc: 'Spare bed in my current place'`,
    `label: s.haveRoom || 'I have a room', desc: s.haveRoomDesc || 'Spare bed in my current place'`
  );
  rmMContent = rmMContent.replace(
    `Campus city *`,
    `{s.campusCity || 'Campus city *'}`
  );
  rmMContent = rmMContent.replace(
    `placeholder="Select city"`,
    `placeholder={s.selectCity || "Select city"}`
  );
  rmMContent = rmMContent.replace(
    `Preferred neighbourhood`,
    `{s.preferredNeighborhood || 'Preferred neighbourhood'}`
  );
  rmMContent = rmMContent.replace(
    `placeholder="e.g. Molyko, Bonduma"`,
    `placeholder={s.neighborhoodPlaceholder || "e.g. Molyko, Bonduma"}`
  );
  rmMContent = rmMContent.replace(
    `Max budget / person (XAF) *`,
    `{s.maxBudget || 'Max budget / person (XAF) *'}`
  );
  rmMContent = rmMContent.replace(
    `Target move-in date *`,
    `{s.targetMoveInDate || 'Target move-in date *'}`
  );

  rmMContent = rmMContent.replace(
    `label="Sleep schedule"`,
    `label={s.sleepSchedule || "Sleep schedule"}`
  );
  rmMContent = rmMContent.replace(
    `label: 'Early bird', desc: 'Up by 7am'`,
    `label: s.earlyBird || 'Early bird', desc: s.earlyBirdDesc || 'Up by 7am'`
  );
  rmMContent = rmMContent.replace(
    `label: 'Flexible',   desc: 'Goes with flow'`,
    `label: s.flexible || 'Flexible', desc: s.flexibleDesc || 'Goes with flow'`
  );
  rmMContent = rmMContent.replace(
    `label: 'Night owl',  desc: 'Up past midnight'`,
    `label: s.nightOwl || 'Night owl', desc: s.nightOwlDesc || 'Up past midnight'`
  );

  rmMContent = rmMContent.replace(
    `label="Cleanliness"`,
    `label={s.cleanliness || "Cleanliness"}`
  );
  rmMContent = rmMContent.replace(
    `label: 'Very neat',  desc: 'Always tidy'`,
    `label: s.veryNeat || 'Very neat', desc: s.veryNeatDesc || 'Always tidy'`
  );
  rmMContent = rmMContent.replace(
    `label: 'Neat',       desc: 'Weekly clean'`,
    `label: s.neat || 'Neat', desc: s.neatDesc || 'Weekly clean'`
  );
  rmMContent = rmMContent.replace(
    `label: 'Relaxed',    desc: 'Some clutter OK'`,
    `label: s.relaxed || 'Relaxed', desc: s.relaxedDesc || 'Some clutter OK'`
  );

  rmMContent = rmMContent.replace(
    `label="Social habits"`,
    `label={s.socialHabits || "Social habits"}`
  );
  rmMContent = rmMContent.replace(
    `label: 'Quiet home', desc: 'Rarely has guests'`,
    `label: s.quietHome || 'Quiet home', desc: s.quietHomeDesc || 'Rarely has guests'`
  );
  rmMContent = rmMContent.replace(
    `label: 'Balanced',   desc: 'Occasional guests'`,
    `label: s.balanced || 'Balanced', desc: s.balancedDesc || 'Occasional guests'`
  );
  rmMContent = rmMContent.replace(
    `label: 'Social',     desc: 'Friends over often'`,
    `label: s.social || 'Social', desc: s.socialDesc || 'Friends over often'`
  );

  rmMContent = rmMContent.replace(
    `label="Study habits"`,
    `label={s.studyHabits || "Study habits"}`
  );
  rmMContent = rmMContent.replace(
    `label: 'Studies home',    desc: 'Needs quiet'`,
    `label: s.studiesHome || 'Studies home', desc: s.studiesHomeDesc || 'Needs quiet'`
  );
  rmMContent = rmMContent.replace(
    `label: 'Mixed',           desc: 'Flexible'`,
    `label: s.mixed || 'Mixed', desc: s.mixedDesc || 'Flexible'`
  );
  rmMContent = rmMContent.replace(
    `label: 'Studies out',     desc: 'Home is relaxed'`,
    `label: s.studiesOut || 'Studies out', desc: s.studiesOutDesc || 'Home is relaxed'`
  );

  rmMContent = rmMContent.replace(
    `Smoking & pets`,
    `{s.smokingAndPets || 'Smoking & pets'}`
  );
  rmMContent = rmMContent.replace(
    `label="I smoke"`,
    `label={s.iSmoke || "I smoke"}`
  );
  rmMContent = rmMContent.replace(
    `label="Smokers OK"`,
    `label={s.smokersOk || "Smokers OK"}`
  );
  rmMContent = rmMContent.replace(
    `label="I have a pet"`,
    `label={s.iHavePet || "I have a pet"}`
  );
  rmMContent = rmMContent.replace(
    `label="Pets OK"`,
    `label={s.petsOk || "Pets OK"}`
  );

  rmMContent = rmMContent.replace(
    `Preferred roommate gender`,
    `{s.preferredGender || 'Preferred roommate gender'}`
  );
  rmMContent = rmMContent.replace(
    `label: 'No preference'`,
    `label: s.noPreference || 'No preference'`
  );
  rmMContent = rmMContent.replace(
    `label: 'Female'`,
    `label: s.female || 'Female'`
  );
  rmMContent = rmMContent.replace(
    `label: 'Male'`,
    `label: s.male || 'Male'`
  );

  rmMContent = rmMContent.replace(
    `Short bio`,
    `{s.shortBio || 'Short bio'}`
  );
  rmMContent = rmMContent.replace(
    `(optional, max 300 chars)`,
    `({s.optionalMax300 || 'optional, max 300 chars'})`
  );
  rmMContent = rmMContent.replace(
    `placeholder="Tell potential roommates a bit about yourself…"`,
    `placeholder={s.bioPlaceholder || "Tell potential roommates a bit about yourself…"}`
  );

  rmMContent = rmMContent.replace(
    `Saving…`,
    `{s.saving || 'Saving…'}`
  );
  rmMContent = rmMContent.replace(
    `isEdit ? 'Save changes' : 'Join the roommate pool'`,
    `isEdit ? (s.saveChanges || 'Save changes') : (s.joinPoolBtn || 'Join the roommate pool')`
  );

  fs.writeFileSync(rmMPath, rmMContent);
}

console.log('Roommate components translated.');
