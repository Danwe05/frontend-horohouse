const fs = require('fs');

const files = [
    'app/dashboard/admin/users/page.tsx',
    'app/dashboard/admin/properties/page.tsx',
    'app/dashboard/admin/students/page.tsx'
];

for (const file of files) {
    if (!fs.existsSync(file)) {
        console.log("File not found: " + file);
        continue;
    }
    let content = fs.readFileSync(file, 'utf8');

    // Layout
    content = content.replace(/bg-\[#f8fafc\]/g, 'bg-white font-sans text-[#222222]');
    content = content.replace(/bg-\[#F7F7F7\] overflow-x-hidden/g, 'bg-white font-sans text-[#222222] overflow-x-hidden');
    
    // Cards & Tables Backgrounds
    content = content.replace(/bg-slate-50\/70/g, 'bg-[#F7F7F7]');
    content = content.replace(/bg-slate-50\/50/g, 'bg-[#F7F7F7]');
    content = content.replace(/bg-slate-50/g, 'bg-[#F7F7F7]');
    content = content.replace(/bg-slate-100/g, 'bg-[#EBEBEB]');
    content = content.replace(/hover:bg-slate-50\/70/g, 'hover:bg-[#F7F7F7]');
    content = content.replace(/hover:bg-slate-100/g, 'hover:bg-[#F7F7F7]');
    content = content.replace(/hover:bg-slate-50/g, 'hover:bg-[#F7F7F7]');

    // Borders
    content = content.replace(/border-slate-100/g, 'border-[#EBEBEB]');
    content = content.replace(/border-slate-200\/80/g, 'border-[#DDDDDD]');
    content = content.replace(/border-slate-200/g, 'border-[#DDDDDD]');
    
    // Text colors
    content = content.replace(/text-slate-900/g, 'text-[#222222]');
    content = content.replace(/text-slate-800/g, 'text-[#222222]');
    content = content.replace(/text-slate-700/g, 'text-[#222222]');
    content = content.replace(/text-slate-600/g, 'text-[#717171]');
    content = content.replace(/text-slate-500/g, 'text-[#717171]');
    content = content.replace(/text-slate-400/g, 'text-[#B0B0B0]');
    content = content.replace(/text-slate-300/g, 'text-[#B0B0B0]');

    // Accent -> Black Primary
    content = content.replace(/bg-blue-600 hover:bg-blue-700/g, 'bg-[#222222] hover:bg-black');
    content = content.replace(/bg-blue-600/g, 'bg-[#222222]');
    content = content.replace(/bg-blue-50/g, 'bg-[#F7F7F7]');
    content = content.replace(/bg-purple-600/g, 'bg-[#222222]');
    content = content.replace(/bg-purple-50/g, 'bg-[#F7F7F7]');
    content = content.replace(/text-blue-600/g, 'text-[#222222]');
    content = content.replace(/text-blue-700/g, 'text-[#222222]');
    content = content.replace(/text-purple-600/g, 'text-[#222222]');

    // Tweak "uppercase tracking-wider" for table headers
    content = content.replace(/text-xs font-semibold text-\[#717171\] uppercase tracking-wider/g, 'text-[14px] font-semibold text-[#222222]');
    content = content.replace(/text-xs font-semibold text-\[#222222\] uppercase tracking-wider/g, 'text-[14px] font-semibold text-[#222222]');

    // Convert rounded to 2xl, shadow
    content = content.replace(/rounded-xl/g, 'rounded-2xl');

    // Page Titles
    content = content.replace(/text-2xl font-extrabold tracking-tight/g, 'text-[32px] font-bold tracking-tight mb-2');

    fs.writeFileSync(file, content);
}
console.log("Done transforming!");
