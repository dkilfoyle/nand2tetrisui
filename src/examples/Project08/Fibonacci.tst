// This file is part of www.nand2tetris.org
// and the book "The Elements of Computing Systems"
// by Nisan and Schocken, MIT Press.
// File name: projects/08/ProgramFlow/FibonacciSeries/FibonacciSeries.tst

output-list RAM[3000]%D1.6.2 RAM[3001]%D1.6.2 RAM[3002]%D1.6.2 
            RAM[3003]%D1.6.2 RAM[3004]%D1.6.2 RAM[3005]%D1.6.2;

ROM32K load Fibonacci.vm;

set Memory[0] 256,
set Memory[1] 300,
set Memory[2] 400,
set Memory[400] 6,
set Memory[401] 3000;

repeat 1100 {
  tick, tock;
}

output;