output-list time%S1.4.1 reset%B2.1.2 ARegister[]%D1.7.1 DRegister[]%D1.7.1 PC[]%D0.4.0 RAM16K[0]%D1.7.1 RAM16K[1]%D1.7.1 RAM16K[2]%D1.7.1;

// Load a program written in the Hack machine language.
// The program computes the maximum of RAM[0] and RAM[1] 
// and writes the result in RAM[2].

ROM32K load Max.hack,

// first run: compute max(3,5)
set Memory[0] 3,
set Memory[1] 5,
output;

repeat 14 {
    tick, tock, output;
}

// reset the PC
set reset 1,
tick, tock, output;

// second run: compute max(23456,12345)
set reset 0,
set Memory[0] 23456,
set Memory[1] 12345,
output;

// The run on these inputs needs less cycles (different branching)
repeat 10 {
    tick, tock, output;
}