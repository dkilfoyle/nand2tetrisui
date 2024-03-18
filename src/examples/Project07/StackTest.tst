// This file is part of www.nand2tetris.org
// and the book "The Elements of Computing Systems"
// by Nisan and Schocken, MIT Press.
// File name: projects/07/StackArithmetic/StackTest/StackTest.tst

output-list Memory[0]%D2.6.2 Memory[256]%D2.6.2 Memory[257]%D2.6.2 Memory[258]%D2.6.2 Memory[259]%D2.6.2 Memory[260]%D2.6.2 Memory[261]%D2.6.2 Memory[262]%D2.6.2 Memory[263]%D2.6.2 Memory[264]%D2.6.2 Memory[265]%D2.6.2;
ROM32K load StackTest.vm;

set Memory[0] 256;  // initializes the stack pointer

repeat 1000 {    // enough cycles to complete the execution
  tick, tock;
}

// outputs the stack pointer (Memory[0]) and 
// the stack contents: Memory[256]-Memory[265]
output;