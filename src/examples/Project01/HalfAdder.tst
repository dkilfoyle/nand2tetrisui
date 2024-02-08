// This file is part of www.nand2tetris.org
// and the book "The Elements of Computing Systems"
// by Nisan and Schocken, MIT Press.
// File name: projects/02/HalfAdder.tst

set a 0,
set b 0,
eval,
expect sum 0,
expect carry 0;

set a 0,
set b 1,
eval,
expect sum 1,
expect carry 0;

set a 1,
set b 0,
eval,
expect sum 1,
expect carry 0;

set a 1,
set b 1,
eval,
expect sum 1,
expect carry 1;
