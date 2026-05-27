using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using notes_api.Data;
using notes_api.Interfaces;
using notes_api.Models;

namespace notes_api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class NotesController : ControllerBase
    {
        private readonly INoteService _service;

        public NotesController(INoteService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Note>>> GetAll()
        {
            return Ok(await _service.GetAllAsync());
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Note>> GetById(int id)
        {
            var note = await _service.GetByIdAsync(id);
            if (note == null) return NotFound();
            return Ok(note);
        }

        [HttpPost]
        public async Task<ActionResult<Note>> Create(Note note)
        {
            var created = await _service.CreateAsync(note);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<Note>> Update(int id, Note note)
        {
            var updated = await _service.UpdateAsync(id, note);
            if (updated == null) return NotFound();
            return Ok(updated);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await _service.DeleteAsync(id);
            if (!result) return NotFound();
            return NoContent();
        }
    }
}