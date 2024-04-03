// Test file for NestedCall test.

output-list RAM[0]%D1.6.1 RAM[1]%D1.6.1 RAM[2]%D1.6.1 RAM[3]%D1.6.1 RAM[4]%D1.6.1 RAM[5]%D1.6.1 RAM[6]%D1.6.1;
ROM32K load NestedCalls.vm;

set Memory[0] 261,
set Memory[1] 261,
set Memory[2] 256,
set Memory[3] -3,
set Memory[4] -4,
set Memory[5] -1, // test results
set Memory[6] -1,
set Memory[256] 1234, // fake stack frame from call Sys.init
set Memory[257] -1,
set Memory[258] -2,
set Memory[259] -3,
set Memory[260] -4,

set Memory[261] -1, // Initialize stack to check for local segment
set Memory[262] -1, // being cleared to zero.
set Memory[263] -1,
set Memory[264] -1,
set Memory[265] -1,
set Memory[266] -1,
set Memory[267] -1,
set Memory[268] -1,
set Memory[269] -1,
set Memory[270] -1,
set Memory[271] -1,
set Memory[272] -1,
set Memory[273] -1,
set Memory[274] -1,
set Memory[275] -1,
set Memory[276] -1,
set Memory[277] -1,
set Memory[278] -1,
set Memory[279] -1,
set Memory[280] -1,
set Memory[281] -1,
set Memory[282] -1,
set Memory[283] -1,
set Memory[284] -1,
set Memory[285] -1,
set Memory[286] -1,
set Memory[287] -1,
set Memory[288] -1,
set Memory[289] -1,
set Memory[290] -1,
set Memory[291] -1,
set Memory[292] -1,
set Memory[293] -1,
set Memory[294] -1,
set Memory[295] -1,
set Memory[296] -1,
set Memory[297] -1,
set Memory[298] -1,
set Memory[299] -1;

repeat 4000 {
  tick, tock;
}

output;