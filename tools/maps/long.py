L={}
L['x1']=dict(h=['000000000000', '000000004440', '000000004440', '000001234440', '000000000000', '000000000000', '000000000000', '042000000000', '022000000220', '000000000240', '000000000000', '000000000000', '000000000000', '000000000000', '222100000222', '222000000222', '222000000222', '222000000222', '222000000222', '222000000222', '222000000222', '000000000100', '000000000000', '000000000000', '404400004404', '000000000000', '600000000006', '000000000220', '022000000220', '022000000000', '000000000000', '000000000000', '000000000000', '000000000000'],m=[
"~~~~~~~~~~~~",#0
"~..C.....X.~",#1
"~.I......w.~",#2
"~...C.......",#3
"~.....C.....",#4
"~..w.....C..",#5
"~.....T.....",#6
"~......C....",#7
"~.......w..~",#8
"EE.C.......~",#9
"E...........",#10
"....C...w...",#11
"............",#12
"...C......C.",#13
"..........S.",#14
".w.......w..",#15
"...C....C...",#16
".H..........",#17
"...C....C...",#18
".X........X.",#19
"..w.......w.",#20
".........Y..",#21
"...C..M.C...",#22
"...C......n.",#23
".K..DTDD..n.",#24
"...C....C.n.",#25
".w.......w..",#26
"....C..C....",#27
"......w.....",#28
"...C....C...",#29
"............",#30
".C........C.",#31
"...PPPPP....",#32
"~~~......~~~",#33
],
stages=[
 dict(name='Breach the gate',objectives=[dict(type='plant',targets=[[5,24]],need=2,clears=[[4,24],[6,24],[7,24]])],spawns=None,addTurns=0,
      enemies=[['trooper',3,21],['trooper',8,21],['heavy',5,20],['marksman',2,24],['infiltrator',9,22],['turret',7,22]],reinf=[[3,[['trooper',2,18]]]]),
 dict(name='Escort the bot',objectives=[dict(type='escort',path=[[5,z] for z in range(23,12,-1)],hp=320)],spawns=[[4,25],[5,25],[6,25],[7,25]],addTurns=8,
      enemies=[['trooper',1,16],['marksman',10,16],['trooper',2,13],['medic',9,13],['heavy',7,12]],reinf=[[3,[['trooper',11,12]]],[5,[['infiltrator',10,11]]]]),
 dict(name='Take the crane',objectives=[dict(type='repair',targets=[[6,6]],need=3),dict(type='extract')],spawns=[[4,14],[5,14],[6,14],[7,14]],addTurns=6,
      enemies=[['heavy',2,4],['trooper',2,5],['trooper',8,5],['marksman',10,2],['medic',4,7],['infiltrator',11,4],['engineer',7,8]],reinf=[[2,[['trooper',5,1]]],[4,[['heavy',6,1]]]]),
],
secondaries=[
 dict(id='door',type='hack',stage=0,targets=[[1,24]],need=2,label='Hack the side door'),
 dict(id='stairs',type='build',stage=1,targets=[[9,21]],need=2,label='Build the side stairs'),
 dict(id='mg',type='mg',stage=1,targets=[[6,22]],need=2,label='Build an MG nest'),
],turns=10,
 feat=['............', '............', '............', '............', '............', '............', '............', '.L..........', '............', '..........L.', '............', '............', '............', '............', '............', '............', '............', '..s......s..', '............', '....r..r....', '............', '............', '............', '............', '..L......L..', '............', 'L..........L', '............', '.........s..', '..s.........', '............', '............', '............', '............'],zips=[[10,15,5,7],[0,26,2,21],[11,26,10,22]],
 points=[dict(type='supply',x=2,z=11),dict(type='zipanchor',x=2,z=14,zip=[1,14,4,8])],
 traps=[dict(type='crane',x=10,z=29,area=[[5,27],[6,27],[5,28],[6,28]],crate=[5,27]),dict(type='barrels',x=1,z=22),dict(type='barrels',x=2,z=21),dict(type='steam',x=8,z=4,line=[[9,4],[10,4],[11,4]])])

# Security Tower: Breakout (built in tower.py)
from tower import TOWER
L['x2'] = TOWER

# Terminal: Data Run (built in terminal.py)
from terminal import TERMINAL
L['x3'] = TERMINAL

# Harbour Row: Control (built in control.py)
from control import CONTROL
L['c1'] = CONTROL

from tidewater import TIDEWATER
L['x4'] = TIDEWATER
from foundry import INDUSTRIAL
L['x5'] = INDUSTRIAL
from container2 import CONTAINER2
L['x1_old'] = L['x1']   # the 12 x 34 original, kept for reference
L['x1'] = CONTAINER2    # Container City at 24 x 32 with buildings (live since update 21)
del L['x1_old']
# The rebuilt operations at 24 x 32 (Harbour Row 28 x 28), live since update 22.
# The originals stay in their own files for reference.
from breakout2 import BREAKOUT2
L['x2'] = BREAKOUT2
from terminal2 import TERMINAL2
L['x3'] = TERMINAL2
from tidewater2 import TIDEWATER2
L['x4'] = TIDEWATER2
from foundry2 import FOUNDRY2
L['x5'] = FOUNDRY2
from control2 import CONTROL2
L['c1'] = CONTROL2
