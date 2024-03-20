// This file is part of www.nand2tetris.org
// and the book "The Elements of Computing Systems"
// by Nisan and Schocken, MIT Press.
// File name: projects/07/StackArithmetic/SimpleAdd/SimpleAdd.tst

output-list RAM[0]%D2.6.2 RAM[256]%D2.6.2 RAM[257]%D2.6.2 ARegister[]%D1.7.1 DRegister[]%D1.7.1;
ROM32K load SimpleAdd.vm;

set Memory[0] 256;  // initializes the stack pointer 

repeat 60 {      // enough cycles to complete the execution
  tick, tock;
}

output;          // the stack pointer and the stack base