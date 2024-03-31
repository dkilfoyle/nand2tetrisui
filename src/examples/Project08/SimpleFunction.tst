// This file is part of www.nand2tetris.org
// and the book "The Elements of Computing Systems"
// by Nisan and Schocken, MIT Press.
// File name: projects/08/FunctionCalls/SimpleFunction/SimpleFunction.tst

output-list RAM[0]%D1.6.1 RAM[1]%D1.6.1 RAM[2]%D1.6.1 
            RAM[3]%D1.6.1 RAM[4]%D1.6.1 RAM[310]%D1.6.1;

ROM32K load SimpleFunction.vm;

set Memory[0] 317,    // SP
set Memory[1] 317,    // LCL
set Memory[2] 310,    // ARG
set Memory[3] 3000,   // THIS
set Memory[4] 4000,   // THAT
set Memory[310] 1234,
set Memory[311] 37,
set Memory[312] 1000,
set Memory[313] 305,
set Memory[314] 300,
set Memory[315] 3010,
set Memory[316] 4010;

repeat 300 {
  tick, tock;
}

output;