// This file is part of www.nand2tetris.org
// and the book "The Elements of Computing Systems"
// by Nisan and Schocken, MIT Press.
// File name: projects/07/MemoryAccess/PointerTest/PointerTest.tst

output-list RAM[256]%D1.6.1 RAM[3]%D1.6.1 RAM[4]%D1.6.1 RAM[3032]%D1.6.1 RAM[3046]%D1.6.1;

ROM32K load PointerTest.vm;

set Memory[0] 256;   // initializes the stack pointer

repeat 450 {      // enough cycles to complete the execution
  tick, tock;
}

// outputs the stack base, this, that, and
// some values from the the this and that segments
output;