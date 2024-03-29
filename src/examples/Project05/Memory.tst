output-list in%D1.6.1 load%B2.1.2 address%B1.15.1 out%D1.6.1;

// Set RAM[0] = -1
set address 0,
set in   -1, set load 1, tick, output; tock, output;

// RAM[0] holds value
set in 9999, set load 0, tick, output; tock, output;

// Did not also write to upper RAM or Screen
set address %X2000, eval, output;
set address %X4000, eval, output;

// Set RAM[0x2000] = 2222
set address %X2000,
set in 2222, set load 1, tick, output; tock, output;

// RAM[0x2000] holds value
set in 9999, set load 0, tick, output; tock, output;

// Did not also write to lower RAM or Screen
set address 0, eval, output;
set address %X4000, eval, output;

set load 0,	// Low order address bits connected
set address %X0001, eval, output;
set address %X0002, eval, output;
set address %X0004, eval, output;
set address %X0008, eval, output;
set address %X0010, eval, output;
set address %X0020, eval, output;
set address %X0040, eval, output;
set address %X0080, eval, output;
set address %X0100, eval, output;
set address %X0200, eval, output;
set address %X0400, eval, output;
set address %X0800, eval, output;
set address %X1000, eval, output;
set address %X2000, eval, output;

// RAM[1234] = 1234
set address %X1234,
set in 1234, set load 1, tick, output; tock, output;

// Did not also write to upper RAM or Screen 
set load 0,
set address %X2234, eval, output;
set address %X6234, eval, output;

// RAM[0x2345] = 2345
set address %X2345,
set in 2345, set load 1, tick, output; tock, output;

// Did not also write to lower RAM or Screen 
set load 0,
set address %X0345, eval, output;
set address %X4345, eval, output;

// Keyboard test

// set address 24576,
// echo "Click the Keyboard icon and hold down the 'K' key (uppercase) until you see the next message (it should appear shortly after that) ...",
// It's important to keep holding the key down since if the system is busy,
// the memory will zero itself before being outputted.

/*
set Keyboard 'K';
while out <> 75 {
    eval,
}
clear-echo, output;
output;
*/

// Screen test

set load 1, set in -1, set address %X4FCF, tick, tock, output;
set address %X504F, tick, tock, output;

// Did not also write to lower or upper RAM
set address %X0FCF, eval, output;
set address %X2FCF, eval, output;

set load 0,				// Low order address bits connected
set address %X4FCE, eval, output;
set address %X4FCD, eval, output;
set address %X4FCB, eval, output;
set address %X4FC7, eval, output;
set address %X4FDF, eval, output;
set address %X4FEF, eval, output;
set address %X4F8F, eval, output;
set address %X4F4F, eval, output;
set address %X4ECF, eval, output;
set address %X4DCF, eval, output;
set address %X4BCF, eval, output;
set address %X47CF, eval, output;
set address %X5FCF, eval, output;


set load 0, set address 24576,
echo "Make sure you see ONLY two horizontal lines in the middle of the screen. Change Keyboard to 'Y' (uppercase) to continue ...";

/*
while out <> 89 {
    eval;
}
*/
clear-echo;