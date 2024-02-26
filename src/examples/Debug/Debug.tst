set x 0,
set y 0,
eval,
output,
expect z 0;

set x 0,
set y 1,
eval,
output,
expect z 0;

set x 1,
set y 0,
eval,
output,
expect z 0;

set x 1,
set y 1,
eval,
output,
expect z 1;