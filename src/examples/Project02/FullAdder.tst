// output-list a%B3.1.3 b%B3.1.3 c%B3.1.3 sum%B3.1.3 carry%B3.1.3;

set a 0,
set b 0,
set c 0,
eval,
output,
expect sum 0,
expect carry 0,
note "0+0 = [0]0";

set c 1,
eval,
output,
expect sum 1,
expect carry 0,
note "0+0+carryin = [0]1";

set b 1,
set c 0,
eval,
output,
expect sum 1,
expect carry 0,
note "0+1 = [0]1";

// a =0, b=1, c=1
set c 1,
eval,
output,
expect sum 0,
expect carry 1,
note "0+1+carryin = [1]0";

set a 1,
set b 0,
set c 0,
eval,
output,
expect sum 1,
expect carry 0,
note "1+0 = [0]1";

set c 1,
eval,
output,
expect sum 0,
expect carry 1,
note "1+0+carryin = [1]0";

set b 1,
set c 0,
eval,
output,
expect sum 0,
expect carry 1,
note "1+1 = [1]0";

set c 1,
eval,
output,
expect sum 1,
expect carry 1,
note "1+1+carryin = [1]1";