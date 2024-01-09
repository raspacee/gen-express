// Removes any invalid arguments and returns valid arguments only

export default function parse_args(argv: string[]): string[] {
  let args: string[] = [];
  if (argv[2] != "-h") args.push(argv[2]);
  const re: RegExp = /^-[a-zA-Z]$/;
  const re2: RegExp = /-[A-Za-z]=[A-Za-z]+/;
  for (let i = 2; i < argv.length; i++) {
    if (argv[i].match(re) || argv[i].match(re2)) {
      args.push(argv[i]);
    }
  }
  return args;
}
