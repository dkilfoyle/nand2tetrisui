load BugMux.hdl,
output-file BugMux.out,
output-list x%B1.16.1 zx%B1.1.1 nx%B1.1.1 out%B1.16.1;

set x %B000000000010001;  // x = 17

// Compute x
set zx 0, set nx 0, eval, output; // out = 17
set nx 0, set zx 0, eval, output; // out = 17 

// Compute !x
set zx 0, set nx 1, eval, output;  // out = -18
set nx 1, set zx 0, eval, output;  // out = -18

// Compute 0
set zx 1, set nx 0, eval, output;  // out = 17 (wrong)
set nx 0, set zx 1, eval, output;  // out = 0

// Compute -1
set zx 1, set nx 1, eval, output;  // out = -18 (wrong)
set nx 1, set zx 1, eval, output;  // out = -1