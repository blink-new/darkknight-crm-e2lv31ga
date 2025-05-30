import { Company } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontalIcon, GlobeIcon, BuildingIcon, MapPinIcon, EditIcon, Trash2Icon } from 'lucide-react';

interface CompanyListProps {
  companies: Company[];
  onEdit: (company: Company) => void;
  onDelete: (id: string) => void;
  loading?: boolean;
}

export function CompanyList({ companies, onEdit, onDelete, loading }: CompanyListProps) {
  if (loading) {
    return (
      <div className="rounded-md border border-zinc-800 overflow-hidden">
        <Table>
          <TableHeader className="bg-zinc-900">
            <TableRow className="hover:bg-zinc-800/50">
              <TableHead className="w-[300px]">Company</TableHead>
              <TableHead className="hidden md:table-cell">Industry</TableHead>
              <TableHead className="hidden lg:table-cell">Size</TableHead>
              <TableHead className="hidden xl:table-cell">Location</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index} className="hover:bg-zinc-800/50">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded bg-zinc-800 animate-pulse"></div>
                    <div className="h-5 w-40 bg-zinc-800 rounded animate-pulse"></div>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <div className="h-5 w-24 bg-zinc-800 rounded animate-pulse"></div>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <div className="h-5 w-16 bg-zinc-800 rounded animate-pulse"></div>
                </TableCell>
                <TableCell className="hidden xl:table-cell">
                  <div className="h-5 w-32 bg-zinc-800 rounded animate-pulse"></div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end">
                    <div className="h-9 w-9 bg-zinc-800 rounded animate-pulse"></div>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (companies.length === 0) {
    return (
      <div className="text-center py-10 text-zinc-500">
        <BuildingIcon className="mx-auto h-12 w-12 text-zinc-600" />
        <p className="mt-4 text-lg">No companies found.</p>
        <p className="text-sm">Add your first company to get started.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-zinc-800 overflow-hidden">
      <Table>
        <TableHeader className="bg-zinc-900">
          <TableRow className="hover:bg-zinc-800/50">
            <TableHead className="w-[300px]">Company</TableHead>
            <TableHead className="hidden md:table-cell">Industry</TableHead>
            <TableHead className="hidden lg:table-cell">Size</TableHead>
            <TableHead className="hidden xl:table-cell">Location</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {companies.map((company) => (
            <TableRow key={company.id} className="hover:bg-zinc-800/50">
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 rounded border border-zinc-700">
                    <AvatarFallback className="rounded bg-yellow-500/10 text-yellow-500">
                      {company.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium text-white">{company.name}</div>
                    {company.website && (
                      <a
                        href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-xs text-zinc-500 hover:text-yellow-500"
                      >
                        <GlobeIcon className="mr-1 h-3 w-3" />
                        {company.website.replace(/^https?:\/\/(www\.)?/, '')}
                      </a>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {company.industry ? (
                  <Badge variant="outline" className="border-zinc-700 bg-zinc-800/50 text-zinc-300">
                    {company.industry}
                  </Badge>
                ) : (
                  <span className="text-zinc-500">-</span>
                )}
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                {company.size ? (
                  <div className="flex items-center text-sm text-zinc-300">
                    <BuildingIcon className="mr-2 h-3 w-3 text-zinc-500" />
                    {company.size}
                  </div>
                ) : (
                  <span className="text-zinc-500">-</span>
                )}
              </TableCell>
              <TableCell className="hidden xl:table-cell">
                {company.location ? (
                  <div className="flex items-center text-sm text-zinc-300">
                    <MapPinIcon className="mr-2 h-3 w-3 text-zinc-500" />
                    {company.location}
                  </div>
                ) : (
                  <span className="text-zinc-500">-</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-zinc-400 hover:text-white">
                      <MoreHorizontalIcon className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 text-white">
                    <DropdownMenuItem
                      onClick={() => onEdit(company)}
                      className="cursor-pointer focus:bg-zinc-800 focus:text-white"
                    >
                      <EditIcon className="mr-2 h-4 w-4" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-zinc-800" />
                    <DropdownMenuItem
                      onClick={() => onDelete(company.id)}
                      className="text-red-500 focus:bg-red-950 focus:text-red-400 cursor-pointer"
                    >
                      <Trash2Icon className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
