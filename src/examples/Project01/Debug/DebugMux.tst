//set y %B1111111111111111;
set y %B0000000000000000;

// y

set ny 1,
set zy 1,
eval,
expect out %B1111111111111111;

set zy 1,
set ny 1,
eval,
expect out %B1111111111111111;


