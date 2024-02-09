// This file is part of www.nand2tetris.org
// and the book "The Elements of Computing Systems"
// by Nisan and Schocken, MIT Press.
// File name: projects/01/Mux4Way16.tst

// load Mux4Way16.hdl,
// output-file Mux4Way16.out,
// compare-to Mux4Way16.cmp,
// output-list a%B1.16.1 b%B1.16.1 c%B1.16.1 d%B1.16.1 sel%B2.2.2 out%B1.16.1;

set a 0,
set b 0,
set c 0,
set d 0,
set sel 0,
eval,
expect out %B0000000000000000;

set sel 1,
eval,
expect out %B0000000000000000;

set sel 2,
eval,
expect out %B0000000000000000;

set sel 3,
eval,
expect out %B0000000000000000;

set a %B0001001000110100,
set b %B1001100001110110,
set c %B1010101010101010,
set d %B0101010101010101,
set sel 0,
eval,
expect out %B0001001000110100;

set sel 1,
eval,
expect out %B1001100001110110;

set sel 2,
eval,
expect out %B1010101010101010;

set sel 3,
eval,
expect out %B0101010101010101;