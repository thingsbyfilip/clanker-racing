'use strict';
// Level registry. Each js/levels/<id>.js adds an entry to LEVELS.
const LEVELS={};

// The menu order and the unlock rule: [id, how many cleared tracks unlock it (0: open from the start)]. One line is one row of the menu grid.
const LEVEL_TABLE=[
  ['miami',0],
  ['city',0],
  ['dirt',0],
  ['rome',1],
  ['junction',1],
  ['volcanic',1],

  ['forest',2],
  ['quarry',2],
  ['market',3],
  ['farm',3],
  ['toyroom',4],
  ['moon',4],

  ['snow',5],
  ['london',6],
  ['capetown',7],
  ['refinery',8],
  ['dune',9],
  ['mars',10],

  ['machu',12],
  ['carrier',14],
  ['hellcreek',16],
  ['tibet',18],
  ['titan',20],
  ['datacenter',23],

  // ['monsoon',0], // unused, but keep it commented out!
];
const LEVEL_ORDER=LEVEL_TABLE.map(l=>l[0]);
