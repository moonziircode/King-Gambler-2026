import fs from 'fs';
['src/pages/LandingPage.tsx', 'src/pages/Dashboard.tsx', 'src/pages/LeagueHub.tsx', 'src/pages/HowToPlay.tsx'].forEach(f => {
  const code = fs.readFileSync(f, 'utf8');
  fs.writeFileSync(f, code.replace(/\.\.\/components\/ui\/button/g, '@/components/ui/button'));
});
