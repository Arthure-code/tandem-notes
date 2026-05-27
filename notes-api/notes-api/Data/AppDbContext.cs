using Microsoft.EntityFrameworkCore;
using notes_api.Models;

namespace notes_api.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options) { }

        public DbSet<Note> Notes { get; set; }
    }
}
