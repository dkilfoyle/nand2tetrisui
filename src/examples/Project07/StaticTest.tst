// This file is part of www.nand2tetris.org
// and the book "The Elements of Computing Systems"
// by Nisan and Schocken, MIT Press.
// File name: projects/07/MemoryAccess/StaticTest/StaticTest.tst

output-list RAM[256]%D1.6.1;

ROM32K load StaticTest.vm;

set Memory[0] 256;    // initializes the stack pointer

repeat 200 {       // enough cycles to complete the execution
  tick, tock;
}

output;            // the stack base
