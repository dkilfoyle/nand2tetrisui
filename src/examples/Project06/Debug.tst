// This file is part of www.nand2tetris.org
// and the book "The Elements of Computing Systems"
// by Nisan and Schocken, MIT Press.
// File name: projects/07/MemoryAccess/BasicTest/BasicTest.tst

//output-list RAM[256]%D1.6.1 RAM[300]%D1.6.1 RAM[401]%D1.6.1 
//            RAM[402]%D1.6.1 RAM[3006]%D1.6.1 RAM[3012]%D1.6.1
//            RAM[3015]%D1.6.1 RAM[11]%D1.6.1 ARegister%D1.6.1 DRegister%D1.6.1; 

output-list RAM[0]%D1.6.1 RAM[256]%D1.6.1 RAM[14]%D1.6.1 ARegister%D1.6.1 DRegister%D1.6.1; 
ROM32K load Debug.asm;

set Memory[0] 257,   // stack pointer
set Memory[256] 10,
set Memory[1] 14,   // base address of the local segment
set Memory[2] 400,   // base address of the argument segment
set Memory[3] 3000,  // base address of the this segment
set Memory[4] 3010;  // base address of the that segment

tick, tock, output;
tick, tock, output;
tick, tock, output;

//repeat 60 {      // enough cycles to complete the execution
//  tick, tock, output;
//}

// Outputs the stack base and some values
// from the tested memory segments
//output;