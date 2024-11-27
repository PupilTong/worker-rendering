const fix = {
  '*.{ts,tsx,js,jsx,cjs,mjs,css,sass,scss,less,html,yml,yaml,rs,toml,md,json}':
    [
      'dprint fmt --allow-no-files --',
    ],
  'package.json': 'sort-package-json',
};

export default fix;
