using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using NotesApi.Models;

namespace NotesApi.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options) { }

        public DbSet<Note> Notes { get; set; }

        // Dates are stored in UTC. Reading them back as UTC, whatever the
        // provider, keeps the "Z" in the JSON so clients convert them once.
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            var asUtc = new ValueConverter<DateTime, DateTime>(
                toDb => toDb,
                fromDb => DateTime.SpecifyKind(fromDb, DateTimeKind.Utc));

            modelBuilder.Entity<Note>().Property(n => n.CreatedAt).HasConversion(asUtc);
            modelBuilder.Entity<Note>().Property(n => n.UpdatedAt).HasConversion(asUtc);
        }
    }
}
