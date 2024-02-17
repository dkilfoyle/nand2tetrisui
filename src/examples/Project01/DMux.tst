// This file is part of www.nand2tetris.org
// and the book "The Elements of Computing Systems"
// by Nisan and Schocken, MIT Press.
// File name: projects/01/DMux.tst

// load DMux.hdl,
// output-file DMux.out,
// compare-to DMux.cmp,
// output-list in%B3.1.3 sel%B3.1.3 a%B3.1.3 b%B3.1.3;

set in 0,
set sel 0,
eval,
output,
expect a 0,
expect b 0;

set sel 1,
eval,
output,
expect a 0,
expect b 0;

set in 1,
set sel 0,
eval,
output,
expect a 1,
expect b 0;

set sel 1,
eval,
output,
expect a 0,
expect b 1;
