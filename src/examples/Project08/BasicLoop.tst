// This file is part of www.nand2tetris.org
// and the book "The Elements of Computing Systems"
// by Nisan and Schocken, MIT Press.
// File name: projects/08/ProgramFlow/BasicLoop/BasicLoop.tst

output-list RAM[0]%D1.6.1 RAM[256]%D1.6.1;
ROM32K load BasicLoop.vm;

set Memory[0] 256,
set Memory[1] 300,
set Memory[2] 400,
set Memory[400] 3;

repeat 600 {
  tick, tock;
}

output;