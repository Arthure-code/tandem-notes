using Microsoft.EntityFrameworkCore;
using notes_api.Data;
using notes_api.Interfaces;
using notes_api.Models;

namespace notes_api.Services
{
    public class NoteService : INoteService
    {
        private readonly AppDbContext _context;

        public NoteService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Note>> GetAllAsync()
        {
            return await _context.Notes
                .OrderByDescending(n => n.UpdatedAt)
                .ToListAsync();
        }

        public async Task<Note?> GetByIdAsync(int id)
        {
            return await _context.Notes.FindAsync(id);
        }

        public async Task<Note> CreateAsync(Note note)
        {
            note.CreatedAt = DateTime.UtcNow;
            note.UpdatedAt = DateTime.UtcNow;
            _context.Notes.Add(note);
            await _context.SaveChangesAsync();
            return note;
        }

        public async Task<Note?> UpdateAsync(int id, Note note)
        {
            var existing = await _context.Notes.FindAsync(id);
            if (existing == null) return null;

            existing.Titre = note.Titre;
            existing.Details = note.Details;
            existing.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return existing;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var note = await _context.Notes.FindAsync(id);
            if (note == null) return false;

            _context.Notes.Remove(note);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
