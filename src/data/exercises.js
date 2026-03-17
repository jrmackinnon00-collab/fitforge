export const exercises = [
  // ─────────────────────────────
  // BARBELL EXERCISES (1-15)
  // ─────────────────────────────
  {
    id: 'ex_001',
    name: 'Barbell Back Squat',
    primaryMuscles: ['Quads', 'Glutes'],
    secondaryMuscles: ['Hamstrings', 'Core', 'Lower Back'],
    equipment: ['Barbell', 'Power Rack'],
    type: 'Compound',
    techniqueDescription:
      'Stand with feet shoulder-width apart, bar resting on upper traps. Descend until thighs are parallel to floor, keeping chest up and knees tracking over toes.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=barbell+back+squat+proper+form',
  },
  {
    id: 'ex_002',
    name: 'Barbell Front Squat',
    primaryMuscles: ['Quads', 'Glutes'],
    secondaryMuscles: ['Core', 'Upper Back'],
    equipment: ['Barbell', 'Power Rack'],
    type: 'Compound',
    techniqueDescription:
      'Hold bar in front-rack position with elbows high. Descend while keeping torso upright, driving knees out.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=barbell+front+squat+proper+form',
  },
  {
    id: 'ex_003',
    name: 'Barbell Deadlift',
    primaryMuscles: ['Hamstrings', 'Glutes', 'Lower Back'],
    secondaryMuscles: ['Quads', 'Traps', 'Core'],
    equipment: ['Barbell'],
    type: 'Compound',
    techniqueDescription:
      'Stand with bar over mid-foot. Hinge at hips, grip bar outside legs, maintain neutral spine, and drive through floor to stand.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=barbell+deadlift+proper+form',
  },
  {
    id: 'ex_004',
    name: 'Romanian Deadlift',
    primaryMuscles: ['Hamstrings', 'Glutes'],
    secondaryMuscles: ['Lower Back', 'Core'],
    equipment: ['Barbell'],
    type: 'Compound',
    techniqueDescription:
      'Hold bar at hip level. Hinge at hips pushing them back, lowering bar along legs until you feel a hamstring stretch, then drive hips forward.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=romanian+deadlift+proper+form',
  },
  {
    id: 'ex_005',
    name: 'Barbell Bench Press',
    primaryMuscles: ['Chest'],
    secondaryMuscles: ['Shoulders', 'Triceps'],
    equipment: ['Barbell', 'Bench'],
    type: 'Compound',
    techniqueDescription:
      'Lie on bench with feet flat on floor. Grip bar slightly wider than shoulder width. Lower to chest, then press up explosively.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=barbell+bench+press+proper+form',
  },
  {
    id: 'ex_006',
    name: 'Barbell Incline Bench Press',
    primaryMuscles: ['Chest'],
    secondaryMuscles: ['Shoulders', 'Triceps'],
    equipment: ['Barbell', 'Incline Bench'],
    type: 'Compound',
    techniqueDescription:
      'Set bench to 30-45 degrees. Press bar from upper chest, keeping elbows at 45-75 degrees from torso.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=barbell+incline+bench+press+proper+form',
  },
  {
    id: 'ex_007',
    name: 'Barbell Overhead Press',
    primaryMuscles: ['Shoulders'],
    secondaryMuscles: ['Triceps', 'Upper Chest', 'Core'],
    equipment: ['Barbell'],
    type: 'Compound',
    techniqueDescription:
      'Hold bar at shoulder height with a grip just outside shoulders. Press overhead to full lockout, keeping core braced.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=barbell+overhead+press+proper+form',
  },
  {
    id: 'ex_008',
    name: 'Barbell Bent-Over Row',
    primaryMuscles: ['Back', 'Lats'],
    secondaryMuscles: ['Biceps', 'Rear Delts', 'Core'],
    equipment: ['Barbell'],
    type: 'Compound',
    techniqueDescription:
      'Hinge to about 45 degrees. Pull bar to lower chest/upper abdomen, squeezing shoulder blades together at top.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=barbell+bent+over+row+proper+form',
  },
  {
    id: 'ex_009',
    name: 'Barbell Hip Thrust',
    primaryMuscles: ['Glutes'],
    secondaryMuscles: ['Hamstrings', 'Core'],
    equipment: ['Barbell', 'Bench'],
    type: 'Compound',
    techniqueDescription:
      'Upper back on bench, bar over hip crease. Drive hips up to full extension, squeezing glutes hard at top.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=barbell+hip+thrust+proper+form',
  },
  {
    id: 'ex_010',
    name: 'Barbell Curl',
    primaryMuscles: ['Biceps'],
    secondaryMuscles: ['Forearms'],
    equipment: ['Barbell'],
    type: 'Isolation',
    techniqueDescription:
      'Stand with bar at arm length, palms up. Curl bar to shoulder height keeping elbows pinned to sides.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=barbell+curl+proper+form',
  },
  {
    id: 'ex_011',
    name: 'Barbell Skull Crusher',
    primaryMuscles: ['Triceps'],
    secondaryMuscles: [],
    equipment: ['Barbell', 'Bench'],
    type: 'Isolation',
    techniqueDescription:
      'Lie on bench holding bar above eyes. Lower bar toward forehead by bending elbows, then extend back up.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=barbell+skull+crusher+proper+form',
  },
  {
    id: 'ex_012',
    name: 'Barbell Sumo Deadlift',
    primaryMuscles: ['Glutes', 'Quads'],
    secondaryMuscles: ['Hamstrings', 'Lower Back', 'Adductors'],
    equipment: ['Barbell'],
    type: 'Compound',
    techniqueDescription:
      'Wide stance with toes pointed out. Grip bar inside legs, drop hips low, keep chest tall, push floor away.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=barbell+sumo+deadlift+proper+form',
  },
  {
    id: 'ex_013',
    name: 'Barbell Good Morning',
    primaryMuscles: ['Hamstrings', 'Lower Back'],
    secondaryMuscles: ['Glutes', 'Core'],
    equipment: ['Barbell'],
    type: 'Compound',
    techniqueDescription:
      'Bar on upper back, slight knee bend. Hinge forward at hips until torso is near parallel, then return.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=barbell+good+morning+exercise+form',
  },
  {
    id: 'ex_014',
    name: 'Barbell Shrug',
    primaryMuscles: ['Traps'],
    secondaryMuscles: ['Neck'],
    equipment: ['Barbell'],
    type: 'Isolation',
    techniqueDescription:
      'Hold bar at thighs. Shrug shoulders straight up toward ears, pause, lower slowly. No rolling of shoulders.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=barbell+shrug+proper+form',
  },
  {
    id: 'ex_015',
    name: 'Barbell Lunge',
    primaryMuscles: ['Quads', 'Glutes'],
    secondaryMuscles: ['Hamstrings', 'Core'],
    equipment: ['Barbell'],
    type: 'Compound',
    techniqueDescription:
      'Bar on upper back. Step forward into a lunge, lower back knee toward floor, push off front foot to return.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=barbell+lunge+proper+form',
  },

  // ─────────────────────────────
  // DUMBBELL EXERCISES (16-35)
  // ─────────────────────────────
  {
    id: 'ex_016',
    name: 'Dumbbell Bench Press',
    primaryMuscles: ['Chest'],
    secondaryMuscles: ['Shoulders', 'Triceps'],
    equipment: ['Dumbbells', 'Bench'],
    type: 'Compound',
    techniqueDescription:
      'Hold dumbbells at chest level. Press up and slightly inward, control descent back to starting position.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=dumbbell+bench+press+proper+form',
  },
  {
    id: 'ex_017',
    name: 'Dumbbell Incline Press',
    primaryMuscles: ['Chest'],
    secondaryMuscles: ['Shoulders', 'Triceps'],
    equipment: ['Dumbbells', 'Incline Bench'],
    type: 'Compound',
    techniqueDescription:
      'Set bench to 30-45 degrees. Press dumbbells from upper chest, converging slightly at top.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=dumbbell+incline+press+proper+form',
  },
  {
    id: 'ex_018',
    name: 'Dumbbell Fly',
    primaryMuscles: ['Chest'],
    secondaryMuscles: ['Shoulders'],
    equipment: ['Dumbbells', 'Bench'],
    type: 'Isolation',
    techniqueDescription:
      'Lie on bench, arms extended above chest with slight elbow bend. Open arms wide in arc, stretch chest, return.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=dumbbell+fly+proper+form',
  },
  {
    id: 'ex_019',
    name: 'Dumbbell Shoulder Press',
    primaryMuscles: ['Shoulders'],
    secondaryMuscles: ['Triceps', 'Upper Traps'],
    equipment: ['Dumbbells'],
    type: 'Compound',
    techniqueDescription:
      'Hold dumbbells at shoulder height, elbows at 90 degrees. Press overhead to lockout, lower slowly.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=dumbbell+shoulder+press+proper+form',
  },
  {
    id: 'ex_020',
    name: 'Dumbbell Lateral Raise',
    primaryMuscles: ['Shoulders'],
    secondaryMuscles: ['Traps'],
    equipment: ['Dumbbells'],
    type: 'Isolation',
    techniqueDescription:
      'Hold dumbbells at sides. Raise arms out to sides to shoulder height, leading with elbows, lower slowly.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=dumbbell+lateral+raise+proper+form',
  },
  {
    id: 'ex_021',
    name: 'Dumbbell Front Raise',
    primaryMuscles: ['Shoulders'],
    secondaryMuscles: ['Upper Chest'],
    equipment: ['Dumbbells'],
    type: 'Isolation',
    techniqueDescription:
      'Hold dumbbells in front of thighs. Raise both arms forward to shoulder height, lower with control.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=dumbbell+front+raise+proper+form',
  },
  {
    id: 'ex_022',
    name: 'Dumbbell Bent-Over Row',
    primaryMuscles: ['Back', 'Lats'],
    secondaryMuscles: ['Biceps', 'Rear Delts'],
    equipment: ['Dumbbells'],
    type: 'Compound',
    techniqueDescription:
      'Hinge forward, hold dumbbells. Row both dumbbells to sides of torso, squeezing shoulder blades together.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=dumbbell+bent+over+row+proper+form',
  },
  {
    id: 'ex_023',
    name: 'Dumbbell Renegade Row',
    primaryMuscles: ['Back', 'Lats'],
    secondaryMuscles: ['Core', 'Biceps', 'Shoulders'],
    equipment: ['Dumbbells'],
    type: 'Compound',
    techniqueDescription:
      'Plank position on dumbbells. Row one dumbbell to hip while stabilizing with other arm, alternate sides.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=dumbbell+renegade+row+proper+form',
  },
  {
    id: 'ex_024',
    name: 'Dumbbell Romanian Deadlift',
    primaryMuscles: ['Hamstrings', 'Glutes'],
    secondaryMuscles: ['Lower Back', 'Core'],
    equipment: ['Dumbbells'],
    type: 'Compound',
    techniqueDescription:
      'Hold dumbbells in front of thighs. Hinge at hips, lowering dumbbells along legs, feel hamstring stretch, return.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=dumbbell+romanian+deadlift+proper+form',
  },
  {
    id: 'ex_025',
    name: 'Dumbbell Goblet Squat',
    primaryMuscles: ['Quads', 'Glutes'],
    secondaryMuscles: ['Core', 'Hamstrings'],
    equipment: ['Dumbbells'],
    type: 'Compound',
    techniqueDescription:
      'Hold one dumbbell vertically at chest. Squat deep keeping chest tall, elbows tracking inside knees.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=dumbbell+goblet+squat+proper+form',
  },
  {
    id: 'ex_026',
    name: 'Dumbbell Lunge',
    primaryMuscles: ['Quads', 'Glutes'],
    secondaryMuscles: ['Hamstrings', 'Core'],
    equipment: ['Dumbbells'],
    type: 'Compound',
    techniqueDescription:
      'Hold dumbbells at sides, step forward into lunge, lower back knee, push off front foot to return.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=dumbbell+lunge+proper+form',
  },
  {
    id: 'ex_027',
    name: 'Dumbbell Step-Up',
    primaryMuscles: ['Quads', 'Glutes'],
    secondaryMuscles: ['Hamstrings', 'Core'],
    equipment: ['Dumbbells', 'Box'],
    type: 'Compound',
    techniqueDescription:
      'Hold dumbbells at sides. Step onto box with one foot, drive through heel to stand up, step down.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=dumbbell+step+up+proper+form',
  },
  {
    id: 'ex_028',
    name: 'Dumbbell Curl',
    primaryMuscles: ['Biceps'],
    secondaryMuscles: ['Forearms'],
    equipment: ['Dumbbells'],
    type: 'Isolation',
    techniqueDescription:
      'Hold dumbbells at sides, palms forward. Curl to shoulder height, squeeze biceps, lower with control.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=dumbbell+curl+proper+form',
  },
  {
    id: 'ex_029',
    name: 'Dumbbell Hammer Curl',
    primaryMuscles: ['Biceps', 'Brachialis'],
    secondaryMuscles: ['Forearms'],
    equipment: ['Dumbbells'],
    type: 'Isolation',
    techniqueDescription:
      'Neutral grip (palms facing each other). Curl dumbbells to shoulder height, lower with control.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=dumbbell+hammer+curl+proper+form',
  },
  {
    id: 'ex_030',
    name: 'Dumbbell Concentration Curl',
    primaryMuscles: ['Biceps'],
    secondaryMuscles: [],
    equipment: ['Dumbbells', 'Bench'],
    type: 'Isolation',
    techniqueDescription:
      'Seated, elbow braced on inner thigh. Curl dumbbell to shoulder, squeeze hard, lower slowly.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=dumbbell+concentration+curl+proper+form',
  },
  {
    id: 'ex_031',
    name: 'Dumbbell Overhead Tricep Extension',
    primaryMuscles: ['Triceps'],
    secondaryMuscles: [],
    equipment: ['Dumbbells'],
    type: 'Isolation',
    techniqueDescription:
      'Hold one dumbbell overhead with both hands. Lower behind head by bending elbows, extend back up.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=dumbbell+overhead+tricep+extension+proper+form',
  },
  {
    id: 'ex_032',
    name: 'Dumbbell Kickback',
    primaryMuscles: ['Triceps'],
    secondaryMuscles: [],
    equipment: ['Dumbbells'],
    type: 'Isolation',
    techniqueDescription:
      'Hinge forward, upper arm parallel to floor. Extend forearm back to full lockout, squeeze tricep.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=dumbbell+kickback+tricep+proper+form',
  },
  {
    id: 'ex_033',
    name: 'Dumbbell Chest-Supported Row',
    primaryMuscles: ['Back', 'Lats'],
    secondaryMuscles: ['Biceps', 'Rear Delts'],
    equipment: ['Dumbbells', 'Incline Bench'],
    type: 'Compound',
    techniqueDescription:
      'Lie face down on incline bench. Row dumbbells to hips, squeezing shoulder blades, lower with control.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=dumbbell+chest+supported+row+proper+form',
  },
  {
    id: 'ex_034',
    name: 'Dumbbell Arnold Press',
    primaryMuscles: ['Shoulders'],
    secondaryMuscles: ['Triceps', 'Upper Chest'],
    equipment: ['Dumbbells'],
    type: 'Compound',
    techniqueDescription:
      'Start with palms facing you. Rotate palms outward as you press overhead, reverse on the way down.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=dumbbell+arnold+press+proper+form',
  },
  {
    id: 'ex_035',
    name: 'Dumbbell Pullover',
    primaryMuscles: ['Chest', 'Lats'],
    secondaryMuscles: ['Triceps', 'Core'],
    equipment: ['Dumbbells', 'Bench'],
    type: 'Compound',
    techniqueDescription:
      'Lie across bench, hold one dumbbell above chest. Lower dumbbell in arc over head, stretch lats, return.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=dumbbell+pullover+proper+form',
  },

  // ─────────────────────────────
  // CABLE EXERCISES (36-55)
  // ─────────────────────────────
  {
    id: 'ex_036',
    name: 'Cable Chest Fly',
    primaryMuscles: ['Chest'],
    secondaryMuscles: ['Shoulders'],
    equipment: ['Cable Machine'],
    type: 'Isolation',
    techniqueDescription:
      'Set cables at shoulder height. Stand in center, bring handles together in front of chest in hugging motion.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=cable+chest+fly+proper+form',
  },
  {
    id: 'ex_037',
    name: 'Cable Crossover',
    primaryMuscles: ['Chest'],
    secondaryMuscles: ['Shoulders'],
    equipment: ['Cable Machine'],
    type: 'Isolation',
    techniqueDescription:
      'High cables. Bring handles down and together crossing at midline, hold squeeze, return controlled.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=cable+crossover+proper+form',
  },
  {
    id: 'ex_038',
    name: 'Cable Row (Seated)',
    primaryMuscles: ['Back', 'Lats'],
    secondaryMuscles: ['Biceps', 'Rear Delts'],
    equipment: ['Cable Machine', 'Rowing Attachment'],
    type: 'Compound',
    techniqueDescription:
      'Sit with slight forward lean. Pull handle to abdomen squeezing shoulder blades, pause, release with control.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=seated+cable+row+proper+form',
  },
  {
    id: 'ex_039',
    name: 'Cable Lat Pulldown',
    primaryMuscles: ['Lats'],
    secondaryMuscles: ['Biceps', 'Rear Delts'],
    equipment: ['Cable Machine', 'Lat Bar'],
    type: 'Compound',
    techniqueDescription:
      'Wide overhand grip. Pull bar to upper chest, leading with elbows, squeeze lats at bottom, control up.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=cable+lat+pulldown+proper+form',
  },
  {
    id: 'ex_040',
    name: 'Cable Face Pull',
    primaryMuscles: ['Rear Delts', 'Rotator Cuff'],
    secondaryMuscles: ['Traps', 'Upper Back'],
    equipment: ['Cable Machine', 'Rope Attachment'],
    type: 'Isolation',
    techniqueDescription:
      'Cable at face height with rope. Pull to face splitting rope, keeping elbows high and flaring out.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=cable+face+pull+proper+form',
  },
  {
    id: 'ex_041',
    name: 'Cable Tricep Pushdown',
    primaryMuscles: ['Triceps'],
    secondaryMuscles: [],
    equipment: ['Cable Machine', 'Bar Attachment'],
    type: 'Isolation',
    techniqueDescription:
      'High cable with bar attachment. Keep elbows pinned at sides, push bar down to full extension, control up.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=cable+tricep+pushdown+proper+form',
  },
  {
    id: 'ex_042',
    name: 'Cable Overhead Tricep Extension',
    primaryMuscles: ['Triceps'],
    secondaryMuscles: [],
    equipment: ['Cable Machine', 'Rope Attachment'],
    type: 'Isolation',
    techniqueDescription:
      'Face away from cable, rope overhead. Extend arms forward overhead, keeping elbows pointing up.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=cable+overhead+tricep+extension+proper+form',
  },
  {
    id: 'ex_043',
    name: 'Cable Curl',
    primaryMuscles: ['Biceps'],
    secondaryMuscles: ['Forearms'],
    equipment: ['Cable Machine', 'Bar Attachment'],
    type: 'Isolation',
    techniqueDescription:
      'Low cable with bar. Curl to shoulder height keeping elbows stationary, lower with control.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=cable+curl+bicep+proper+form',
  },
  {
    id: 'ex_044',
    name: 'Cable Hammer Curl',
    primaryMuscles: ['Biceps', 'Brachialis'],
    secondaryMuscles: ['Forearms'],
    equipment: ['Cable Machine', 'Rope Attachment'],
    type: 'Isolation',
    techniqueDescription:
      'Low cable with rope, neutral grip. Curl rope to shoulder height, squeeze, lower slowly.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=cable+hammer+curl+proper+form',
  },
  {
    id: 'ex_045',
    name: 'Cable Lateral Raise',
    primaryMuscles: ['Shoulders'],
    secondaryMuscles: [],
    equipment: ['Cable Machine'],
    type: 'Isolation',
    techniqueDescription:
      'Low cable to side. Raise arm across body to shoulder height, control the descent.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=cable+lateral+raise+proper+form',
  },
  {
    id: 'ex_046',
    name: 'Cable Front Raise',
    primaryMuscles: ['Shoulders'],
    secondaryMuscles: ['Upper Chest'],
    equipment: ['Cable Machine'],
    type: 'Isolation',
    techniqueDescription:
      'Low cable behind you. Raise arm forward to shoulder height, lower with control.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=cable+front+raise+proper+form',
  },
  {
    id: 'ex_047',
    name: 'Cable Pull-Through',
    primaryMuscles: ['Glutes', 'Hamstrings'],
    secondaryMuscles: ['Lower Back', 'Core'],
    equipment: ['Cable Machine', 'Rope Attachment'],
    type: 'Compound',
    techniqueDescription:
      'Face away from cable, rope between legs. Hinge at hips, thrust forward driving glutes, squeeze at top.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=cable+pull+through+proper+form',
  },
  {
    id: 'ex_048',
    name: 'Cable Hip Abduction',
    primaryMuscles: ['Glutes', 'Hip Abductors'],
    secondaryMuscles: [],
    equipment: ['Cable Machine', 'Ankle Attachment'],
    type: 'Isolation',
    techniqueDescription:
      'Cable at ankle on working leg. Raise leg out to the side, squeeze glute, return with control.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=cable+hip+abduction+proper+form',
  },
  {
    id: 'ex_049',
    name: 'Cable Crunch',
    primaryMuscles: ['Core', 'Abs'],
    secondaryMuscles: [],
    equipment: ['Cable Machine', 'Rope Attachment'],
    type: 'Isolation',
    techniqueDescription:
      'Kneel facing cable machine with rope at neck. Crunch down contracting abs, keep hips stationary.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=cable+crunch+abs+proper+form',
  },
  {
    id: 'ex_050',
    name: 'Cable Woodchop',
    primaryMuscles: ['Core', 'Obliques'],
    secondaryMuscles: ['Shoulders', 'Lats'],
    equipment: ['Cable Machine'],
    type: 'Compound',
    techniqueDescription:
      'High cable to side. Pull handle diagonally across body from high to low, rotating torso.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=cable+woodchop+proper+form',
  },
  {
    id: 'ex_051',
    name: 'Cable Reverse Fly',
    primaryMuscles: ['Rear Delts'],
    secondaryMuscles: ['Upper Back', 'Traps'],
    equipment: ['Cable Machine'],
    type: 'Isolation',
    techniqueDescription:
      'Cross cables at chest height. Pull handles apart spreading arms wide, squeeze rear delts.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=cable+reverse+fly+proper+form',
  },
  {
    id: 'ex_052',
    name: 'Cable Upright Row',
    primaryMuscles: ['Shoulders', 'Traps'],
    secondaryMuscles: ['Biceps'],
    equipment: ['Cable Machine', 'Bar Attachment'],
    type: 'Compound',
    techniqueDescription:
      'Close grip on bar. Pull bar straight up to chin, leading with elbows, lower with control.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=cable+upright+row+proper+form',
  },
  {
    id: 'ex_053',
    name: 'Cable Shrug',
    primaryMuscles: ['Traps'],
    secondaryMuscles: ['Neck'],
    equipment: ['Cable Machine', 'Bar Attachment'],
    type: 'Isolation',
    techniqueDescription:
      'Hold bar at thigh level. Shrug shoulders straight up toward ears, hold briefly, lower.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=cable+shrug+proper+form',
  },
  {
    id: 'ex_054',
    name: 'Cable Romanian Deadlift',
    primaryMuscles: ['Hamstrings', 'Glutes'],
    secondaryMuscles: ['Lower Back'],
    equipment: ['Cable Machine'],
    type: 'Compound',
    techniqueDescription:
      'Low cable, hinge at hips keeping back flat. Feel hamstring stretch, drive hips forward to stand.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=cable+romanian+deadlift+proper+form',
  },
  {
    id: 'ex_055',
    name: 'Cable Kickback',
    primaryMuscles: ['Triceps'],
    secondaryMuscles: [],
    equipment: ['Cable Machine', 'Ankle Attachment'],
    type: 'Isolation',
    techniqueDescription:
      'Cable behind you at ankle. Extend leg back contracting tricep, hold squeeze, return.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=cable+kickback+tricep+proper+form',
  },

  // ─────────────────────────────
  // MACHINE EXERCISES (56-70)
  // ─────────────────────────────
  {
    id: 'ex_056',
    name: 'Leg Press',
    primaryMuscles: ['Quads', 'Glutes'],
    secondaryMuscles: ['Hamstrings'],
    equipment: ['Leg Press Machine'],
    type: 'Compound',
    techniqueDescription:
      'Feet shoulder-width on platform. Lower weight until knees at 90 degrees, press back up without locking out.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=leg+press+proper+form',
  },
  {
    id: 'ex_057',
    name: 'Leg Extension',
    primaryMuscles: ['Quads'],
    secondaryMuscles: [],
    equipment: ['Leg Extension Machine'],
    type: 'Isolation',
    techniqueDescription:
      'Seated, shin pad above feet. Extend legs to full lockout, squeeze quads, lower with control.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=leg+extension+machine+proper+form',
  },
  {
    id: 'ex_058',
    name: 'Leg Curl (Seated)',
    primaryMuscles: ['Hamstrings'],
    secondaryMuscles: ['Calves'],
    equipment: ['Seated Leg Curl Machine'],
    type: 'Isolation',
    techniqueDescription:
      'Seated, pad on lower shins. Curl legs down toward seat, squeeze hamstrings at bottom, extend slowly.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=seated+leg+curl+machine+proper+form',
  },
  {
    id: 'ex_059',
    name: 'Leg Curl (Lying)',
    primaryMuscles: ['Hamstrings'],
    secondaryMuscles: ['Calves'],
    equipment: ['Lying Leg Curl Machine'],
    type: 'Isolation',
    techniqueDescription:
      'Face down, pad above heels. Curl heels toward glutes, squeeze hamstrings, lower with control.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=lying+leg+curl+machine+proper+form',
  },
  {
    id: 'ex_060',
    name: 'Chest Press Machine',
    primaryMuscles: ['Chest'],
    secondaryMuscles: ['Shoulders', 'Triceps'],
    equipment: ['Chest Press Machine'],
    type: 'Compound',
    techniqueDescription:
      'Sit with back supported. Press handles forward to full arm extension, return with control.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=chest+press+machine+proper+form',
  },
  {
    id: 'ex_061',
    name: 'Pec Deck / Machine Fly',
    primaryMuscles: ['Chest'],
    secondaryMuscles: ['Shoulders'],
    equipment: ['Pec Deck Machine'],
    type: 'Isolation',
    techniqueDescription:
      'Elbows on pads at shoulder height. Bring arms together in front, squeeze chest, open slowly.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=pec+deck+machine+fly+proper+form',
  },
  {
    id: 'ex_062',
    name: 'Lat Pulldown Machine',
    primaryMuscles: ['Lats'],
    secondaryMuscles: ['Biceps', 'Rear Delts'],
    equipment: ['Lat Pulldown Machine'],
    type: 'Compound',
    techniqueDescription:
      'Wide grip on bar. Pull to chest leading with elbows, squeeze lats, control the return.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=lat+pulldown+machine+proper+form',
  },
  {
    id: 'ex_063',
    name: 'Seated Row Machine',
    primaryMuscles: ['Back', 'Lats'],
    secondaryMuscles: ['Biceps', 'Rear Delts'],
    equipment: ['Seated Row Machine'],
    type: 'Compound',
    techniqueDescription:
      'Chest against pad. Row handles to sides of torso, squeeze shoulder blades, return controlled.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=seated+row+machine+proper+form',
  },
  {
    id: 'ex_064',
    name: 'Shoulder Press Machine',
    primaryMuscles: ['Shoulders'],
    secondaryMuscles: ['Triceps'],
    equipment: ['Shoulder Press Machine'],
    type: 'Compound',
    techniqueDescription:
      'Adjust seat height so handles are at shoulder level. Press up to lockout, lower with control.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=shoulder+press+machine+proper+form',
  },
  {
    id: 'ex_065',
    name: 'Smith Machine Squat',
    primaryMuscles: ['Quads', 'Glutes'],
    secondaryMuscles: ['Hamstrings', 'Core'],
    equipment: ['Smith Machine'],
    type: 'Compound',
    techniqueDescription:
      'Bar on upper back in Smith machine. Squat to parallel maintaining upright torso, drive through heels.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=smith+machine+squat+proper+form',
  },
  {
    id: 'ex_066',
    name: 'Smith Machine Bench Press',
    primaryMuscles: ['Chest'],
    secondaryMuscles: ['Shoulders', 'Triceps'],
    equipment: ['Smith Machine', 'Bench'],
    type: 'Compound',
    techniqueDescription:
      'Lie on bench under Smith bar. Lower to chest with controlled descent, press back up.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=smith+machine+bench+press+proper+form',
  },
  {
    id: 'ex_067',
    name: 'Hip Abductor Machine',
    primaryMuscles: ['Glutes', 'Hip Abductors'],
    secondaryMuscles: [],
    equipment: ['Hip Abductor Machine'],
    type: 'Isolation',
    techniqueDescription:
      'Seated with pads on outside of thighs. Push legs outward against resistance, return with control.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=hip+abductor+machine+proper+form',
  },
  {
    id: 'ex_068',
    name: 'Hip Adductor Machine',
    primaryMuscles: ['Adductors', 'Inner Thigh'],
    secondaryMuscles: [],
    equipment: ['Hip Adductor Machine'],
    type: 'Isolation',
    techniqueDescription:
      'Seated with pads on inside of thighs. Squeeze legs together against resistance, return with control.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=hip+adductor+machine+proper+form',
  },
  {
    id: 'ex_069',
    name: 'Calf Raise Machine',
    primaryMuscles: ['Calves'],
    secondaryMuscles: [],
    equipment: ['Calf Raise Machine'],
    type: 'Isolation',
    techniqueDescription:
      'Shoulder pads on traps, balls of feet on platform. Rise onto toes fully, pause, lower heels below platform.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=calf+raise+machine+proper+form',
  },
  {
    id: 'ex_070',
    name: 'Back Extension Machine',
    primaryMuscles: ['Lower Back', 'Erector Spinae'],
    secondaryMuscles: ['Glutes', 'Hamstrings'],
    equipment: ['Back Extension Machine'],
    type: 'Isolation',
    techniqueDescription:
      'Hips on pad, legs secured. Bend forward then extend back to neutral or slightly hyperextended.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=back+extension+machine+proper+form',
  },

  // ─────────────────────────────
  // BODYWEIGHT EXERCISES (71-85)
  // ─────────────────────────────
  {
    id: 'ex_071',
    name: 'Pull-Up',
    primaryMuscles: ['Lats'],
    secondaryMuscles: ['Biceps', 'Rear Delts', 'Core'],
    equipment: ['Pull-Up Bar'],
    type: 'Compound',
    techniqueDescription:
      'Overhand grip, hands wider than shoulders. Pull chest to bar, keeping core tight, lower with control.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=pull+up+proper+form',
  },
  {
    id: 'ex_072',
    name: 'Chin-Up',
    primaryMuscles: ['Lats', 'Biceps'],
    secondaryMuscles: ['Rear Delts', 'Core'],
    equipment: ['Pull-Up Bar'],
    type: 'Compound',
    techniqueDescription:
      'Underhand grip, shoulder width. Pull chin above bar, squeezing biceps and back, lower with control.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=chin+up+proper+form',
  },
  {
    id: 'ex_073',
    name: 'Push-Up',
    primaryMuscles: ['Chest'],
    secondaryMuscles: ['Shoulders', 'Triceps', 'Core'],
    equipment: ['Bodyweight'],
    type: 'Compound',
    techniqueDescription:
      'Plank position, hands below shoulders. Lower chest to floor keeping body rigid, press back up.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=push+up+proper+form',
  },
  {
    id: 'ex_074',
    name: 'Dip',
    primaryMuscles: ['Chest', 'Triceps'],
    secondaryMuscles: ['Shoulders'],
    equipment: ['Dip Bars'],
    type: 'Compound',
    techniqueDescription:
      'Grip parallel bars, slight forward lean. Lower until upper arms are parallel to floor, press up.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=dip+exercise+proper+form',
  },
  {
    id: 'ex_075',
    name: 'Bodyweight Squat',
    primaryMuscles: ['Quads', 'Glutes'],
    secondaryMuscles: ['Hamstrings', 'Core'],
    equipment: ['Bodyweight'],
    type: 'Compound',
    techniqueDescription:
      'Feet shoulder-width apart. Squat down until thighs parallel to floor, keeping chest tall, stand up.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=bodyweight+squat+proper+form',
  },
  {
    id: 'ex_076',
    name: 'Bulgarian Split Squat',
    primaryMuscles: ['Quads', 'Glutes'],
    secondaryMuscles: ['Hamstrings', 'Core'],
    equipment: ['Bench'],
    type: 'Compound',
    techniqueDescription:
      'Rear foot elevated on bench. Lower front knee toward floor until parallel, drive through front heel.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=bulgarian+split+squat+proper+form',
  },
  {
    id: 'ex_077',
    name: 'Glute Bridge',
    primaryMuscles: ['Glutes'],
    secondaryMuscles: ['Hamstrings', 'Core'],
    equipment: ['Bodyweight'],
    type: 'Isolation',
    techniqueDescription:
      'Lie on back, knees bent, feet flat. Drive hips up squeezing glutes hard at top, lower with control.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=glute+bridge+proper+form',
  },
  {
    id: 'ex_078',
    name: 'Plank',
    primaryMuscles: ['Core', 'Abs'],
    secondaryMuscles: ['Shoulders', 'Glutes'],
    equipment: ['Bodyweight'],
    type: 'Isolation',
    techniqueDescription:
      'Forearms on floor, body straight line. Hold position squeezing core and glutes, breathe steadily.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=plank+exercise+proper+form',
  },
  {
    id: 'ex_079',
    name: 'Side Plank',
    primaryMuscles: ['Core', 'Obliques'],
    secondaryMuscles: ['Shoulders', 'Glutes'],
    equipment: ['Bodyweight'],
    type: 'Isolation',
    techniqueDescription:
      'Side-lying on forearm. Lift hips forming a straight line, hold with core tight, repeat both sides.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=side+plank+proper+form',
  },
  {
    id: 'ex_080',
    name: 'Mountain Climber',
    primaryMuscles: ['Core'],
    secondaryMuscles: ['Shoulders', 'Hip Flexors', 'Quads'],
    equipment: ['Bodyweight'],
    type: 'Compound',
    techniqueDescription:
      'Plank position. Drive alternating knees toward chest rapidly, keeping hips level and core tight.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=mountain+climber+exercise+proper+form',
  },
  {
    id: 'ex_081',
    name: 'Burpee',
    primaryMuscles: ['Full Body'],
    secondaryMuscles: ['Chest', 'Quads', 'Core'],
    equipment: ['Bodyweight'],
    type: 'Compound',
    techniqueDescription:
      'From standing, drop hands to floor, jump feet back to plank, perform push-up, jump feet forward, leap up.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=burpee+proper+form',
  },
  {
    id: 'ex_082',
    name: 'Hanging Knee Raise',
    primaryMuscles: ['Core', 'Abs', 'Hip Flexors'],
    secondaryMuscles: [],
    equipment: ['Pull-Up Bar'],
    type: 'Isolation',
    techniqueDescription:
      'Hang from bar. Raise knees to chest, squeezing abs, lower with control. Avoid swinging.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=hanging+knee+raise+proper+form',
  },
  {
    id: 'ex_083',
    name: 'Hanging Leg Raise',
    primaryMuscles: ['Core', 'Abs', 'Hip Flexors'],
    secondaryMuscles: [],
    equipment: ['Pull-Up Bar'],
    type: 'Isolation',
    techniqueDescription:
      'Hang from bar with straight legs. Raise legs to parallel or higher, lower with control.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=hanging+leg+raise+proper+form',
  },
  {
    id: 'ex_084',
    name: 'Inverted Row',
    primaryMuscles: ['Back', 'Lats'],
    secondaryMuscles: ['Biceps', 'Rear Delts'],
    equipment: ['Barbell', 'Rack'],
    type: 'Compound',
    techniqueDescription:
      'Hang under bar at waist height. Pull chest to bar, squeezing shoulder blades, lower with control.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=inverted+row+proper+form',
  },
  {
    id: 'ex_085',
    name: 'Box Jump',
    primaryMuscles: ['Quads', 'Glutes'],
    secondaryMuscles: ['Hamstrings', 'Calves', 'Core'],
    equipment: ['Box', 'Bodyweight'],
    type: 'Compound',
    techniqueDescription:
      'Stand before box. Dip slightly then explosively jump onto box, land softly with bent knees, step down.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=box+jump+proper+form',
  },
]
