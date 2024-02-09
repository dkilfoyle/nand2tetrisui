// This file is part of www.nand2tetris.org
// and the book "The Elements of Computing Systems"
// by Nisan and Schocken, MIT Press.
// File name: projects/01/Xor.tst

set a 0,
set b 0,
eval,
expect out 0;

set a 0,
set b 1,
eval,
expect out 1;

set a 1,
set b 0,
eval,
expect out 1;

set a 1,
set b 1,
eval,
expect out 0;
