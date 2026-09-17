using Microsoft.EntityFrameworkCore;
using NotesApi.Data;
using NotesApi.Interfaces;
using NotesApi.Models;

namespace NotesApi.Services
{
    // The only class that touches the database. Notes come back newest
    // change first; the dates are set here, whatever the client sent.
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
            var now = DateTime.UtcNow;
            var created = new Note
            {
                Title = note.Title.Trim(),
                Body = note.Body,
                CreatedAt = now,
                UpdatedAt = now,
            };
            _context.Notes.Add(created);
            await _context.SaveChangesAsync();
            return created;
        }

        public async Task<Note?> UpdateAsync(int id, Note note)
        {
            var existing = await _context.Notes.FindAsync(id);
            if (existing == null) return null;

            existing.Title = note.Title.Trim();
            existing.Body = note.Body;
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
