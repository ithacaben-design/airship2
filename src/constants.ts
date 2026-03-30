export interface Peak {
  name: string;
  elevation: number;
  description: string;
  tier: 1 | 2 | 3 | 4; // 1: Valleys, 2: Ridgelines, 3: Deep Woods, 4: High Alpine
}

export interface Bird {
  id: string;
  name: string;
  ability: string;
  description: string;
  unlockedAt: string; // Peak name
  song: string[]; // Array of syllables/notes
}

export const BIRDS: Bird[] = [
  {
    id: 'robin',
    name: 'American Robin',
    ability: 'Dawn Chorus',
    description: 'Rippling notes summon a chorus of responding birds.',
    unlockedAt: 'Heart Lake',
    song: ['Cheer-up', 'Cheer-ily', 'Cheer-up', 'Cheer-ily']
  },
  {
    id: 'chickadee',
    name: 'Black-capped Chickadee',
    ability: 'The Alarm',
    description: 'Drops acorn caches; maximum alarm fills the level with mobbing sounds.',
    unlockedAt: 'Mount Van Hoevenberg',
    song: ['Fee-bee', 'Fee-bee']
  },
  {
    id: 'sawwhet',
    name: 'Saw-whet Owl',
    ability: 'Night Vision',
    description: 'Reveals hidden paths in the deep woods.',
    unlockedAt: 'Cascade Mountain',
    song: ['Toot', 'Toot', 'Toot', 'Toot', 'Toot']
  },
  {
    id: 'bluejay',
    name: 'Blue Jay',
    ability: 'Alarm Shockwave',
    description: 'A massive brute-force screech that shudders parallax layers and clears fog.',
    unlockedAt: 'Gothics',
    song: ['Jay!', 'Jay!', 'Jay!']
  },
  {
    id: 'raven',
    name: 'Common Raven',
    ability: 'The Memory',
    description: 'Reveals a glowing ghost trail of the optimal path.',
    unlockedAt: 'Mount Marcy',
    song: ['Gronk', 'Gronk', 'Gronk']
  }
];

export const ADIRONDACK_46: Peak[] = [
  { name: "Heart Lake", elevation: 2179, description: "The journey begins where the water meets the woods.", tier: 1 },
  { name: "Mount Van Hoevenberg", elevation: 2940, description: "Home to the Olympic bobsled run and great views.", tier: 1 },
  { name: "Cascade Mountain", elevation: 4098, description: "The most popular High Peak, offering 360-degree views.", tier: 2 },
  { name: "Porter Mountain", elevation: 4059, description: "A neighbor to Cascade, often climbed together.", tier: 2 },
  { name: "Phelps Mountain", elevation: 4161, description: "Offers one of the best views of Mount Marcy.", tier: 2 },
  { name: "Big Slide Mountain", elevation: 4240, description: "Named for the massive landslide on its southern face.", tier: 2 },
  { name: "Gothics", elevation: 4736, description: "The most dramatic peak in the Adirondacks, with sheer slides.", tier: 4 },
  { name: "Armstrong Mountain", elevation: 4400, description: "A narrow summit on the Great Range.", tier: 3 },
  { name: "Upper Wolfjaw", elevation: 4185, description: "A steep, wooded peak in the Great Range.", tier: 3 },
  { name: "Lower Wolfjaw", elevation: 4175, description: "The gateway to the Great Range.", tier: 3 },
  { name: "Saddleback Mountain", elevation: 4515, description: "Features a challenging rock scramble known as the 'Staircase'.", tier: 3 },
  { name: "Basin Mountain", elevation: 4827, description: "Named for the deep basin between its two summits.", tier: 3 },
  { name: "Mount Haystack", elevation: 4960, description: "The Great Range's most rugged and remote summit.", tier: 4 },
  { name: "Mount Marcy", elevation: 5344, description: "The highest point in New York, a true alpine tundra.", tier: 4 },
  { name: "Mount Skylight", elevation: 4926, description: "A massive dome of anorthosite with two large cairns.", tier: 4 },
  { name: "Gray Peak", elevation: 4840, description: "A secluded summit located near the Lake of the Clouds.", tier: 3 },
  { name: "Mount Colden", elevation: 4714, description: "Famous for the Trap Dike and its shimmering acoustic updrafts.", tier: 3 },
  { name: "Algonquin Peak", elevation: 5114, description: "Second highest, known for its brutal winds and exposed rock.", tier: 4 },
  { name: "Iroquois Peak", elevation: 4840, description: "A neighbor to Algonquin, offering vast views of the MacIntyre Range.", tier: 4 },
  { name: "Wright Peak", elevation: 4580, description: "Known for its extreme winds and a historic plane crash site.", tier: 4 },
  { name: "Giant Mountain", elevation: 4627, description: "A massive presence overlooking the Keene Valley.", tier: 3 },
  { name: "Rocky Peak Ridge", elevation: 4420, description: "An exposed ridge with continuous views and scrubby pines.", tier: 2 },
  { name: "Dial Mountain", elevation: 4020, description: "Known for its unique 'Bear Den' and burned-over slopes.", tier: 2 },
  { name: "Nippletop", elevation: 4620, description: "A prominent peak with a unique profile and deep forest trails.", tier: 3 },
  { name: "Mount Colvin", elevation: 4057, description: "Named for the surveyor who mapped the Adirondacks.", tier: 2 },
  { name: "Blake Peak", elevation: 3960, description: "A wooded summit often reached via Mount Colvin.", tier: 3 },
  { name: "Sawteeth", elevation: 4100, description: "Named for its serrated profile above Lower Ausable Lake.", tier: 2 },
  { name: "Dix Mountain", elevation: 4857, description: "The center of its own wild and rugged range.", tier: 3 },
  { name: "Hough Peak", elevation: 4400, description: "A sharp peak between Dix and South Dix.", tier: 3 },
  { name: "South Dix", elevation: 4060, description: "A small, rocky summit in the Dix Range.", tier: 2 },
  { name: "Macomb Mountain", elevation: 4405, description: "Features a massive slide of loose rock and gravel.", tier: 2 },
  { name: "Grace Peak", elevation: 4012, description: "Formerly East Dix, named for a legendary 46er.", tier: 2 },
  { name: "Santanoni Peak", elevation: 4607, description: "The heart of the remote Santanoni Range.", tier: 3 },
  { name: "Panther Peak", elevation: 4442, description: "A wild summit in the Santanoni Range.", tier: 3 },
  { name: "Couchsachraga Peak", elevation: 3793, description: "The 'Dismal Wilderness', the lowest of the 46.", tier: 3 },
  { name: "Mount Marshall", elevation: 4360, description: "Named for the founder of the Wilderness Society.", tier: 3 },
  { name: "Allen Mountain", elevation: 4340, description: "The most remote and legendary 'long walk' of the 46.", tier: 3 },
  { name: "Street Mountain", elevation: 4166, description: "A quiet, wooded summit near Heart Lake.", tier: 3 },
  { name: "Nye Mountain", elevation: 3895, description: "A wooded peak near Street Mountain.", tier: 3 },
  { name: "Tabletop Mountain", elevation: 4427, description: "A flat-topped peak covered in dense balsam forest.", tier: 3 },
  { name: "Mount Redfield", elevation: 4606, description: "Named for the scientist who first explored these heights.", tier: 3 },
  { name: "Cliff Mountain", elevation: 3960, description: "A challenging peak known for its muddy trails.", tier: 3 },
  { name: "Seymour Mountain", elevation: 4120, description: "A rugged and isolated peak in the Sewards.", tier: 3 },
  { name: "Donaldson Mountain", elevation: 4140, description: "A central peak in the Seward Range.", tier: 3 },
  { name: "Emmons Mountain", elevation: 4040, description: "The southernmost peak of the Seward Range.", tier: 3 },
  { name: "Esther Mountain", elevation: 4240, description: "The only peak named for a woman who first climbed it.", tier: 3 },
  { name: "Whiteface Mountain", elevation: 4867, description: "The isolated giant of the north, home to the Castle.", tier: 4 }
];
