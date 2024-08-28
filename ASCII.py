import random
import sys

from PIL import Image, ImageFilter
import numpy as np
import tkinter as tk
from tkinter import filedialog, messagebox
import os
import subprocess

ASCII_CHARS = "@%#*+=-:. "

# Фразы для глитч-эффекта
GLITCH_PHRASES = {
    "ZXC": ["ZXC", "1000-7"],
    "HEART": ["<3", "POP"],
    "CLASSIC": []
}


def Re_img(image, new_width=200):
    width, height = image.size
    ratio = height / width
    new_height = int(new_width * ratio)
    resized_image = image.resize((new_width, new_height))
    return resized_image


def grayscale_image(image):
    return image.convert("L")


def image_to_ascii(image, width=200):
    image = Re_img(image, width)
    grayscale = grayscale_image(image)
    pixels = np.array(grayscale)
    ascii_str = ""
    for pixel_row in pixels:
        for pixel in pixel_row:
            ascii_str += ASCII_CHARS[pixel // 32]
        ascii_str += "\n"
    return ascii_str


def add_glitch_effect(ascii_art, glitch_phrases, glitch_probability=0.05):
    lines = ascii_art.splitlines()
    glitched_art = []
    for line in lines:
        new_line = ""
        i = 0
        while i < len(line):
            if random.random() < glitch_probability:
                glitch_phrase = random.choice(glitch_phrases)
                new_line += glitch_phrase
                i += len(glitch_phrase)
            else:
                new_line += line[i]
                i += 1
        glitched_art.append(new_line)
    return "\n".join(glitched_art)


def add_ascii_border(ascii_art, border_char="#", border_width=5):
    lines = ascii_art.splitlines()
    max_length = max(len(line) for line in lines)
    border = border_char * (max_length + 2 * border_width) + "\n"
    bordered_ascii = border * border_width
    for line in lines:
        bordered_ascii += border_char * border_width + line + border_char * (
                max_length - len(line) + border_width) + "\n"
    bordered_ascii += border * border_width
    return bordered_ascii


def save_ascii_art(image_path, output_path, style):
    image = Image.open(image_path)
    ascii_art = image_to_ascii(image, width=200)

    if style == "Heart":
        border_char = "<3"
        glitch_phrases = GLITCH_PHRASES["HEART"]
    elif style == "Deadinside":
        border_char = "zxc"
        glitch_phrases = GLITCH_PHRASES["ZXC"]
    elif style == "Classic":
        border_char = "#"
        glitch_phrases = GLITCH_PHRASES["CLASSIC"]
    else:
        raise ValueError("Не выбран стиль")

    if border_char:
        ascii_art_with_border = add_ascii_border(ascii_art, border_char=border_char, border_width=5)
    else:
        ascii_art_with_border = ascii_art

    if glitch_phrases:
        ascii_art_with_glitch = add_glitch_effect(ascii_art_with_border, glitch_phrases)
    else:
        ascii_art_with_glitch = ascii_art_with_border

    with open(output_path, "w") as f:
        f.write(ascii_art_with_glitch)


    if os.name == 'nt':
        os.startfile(output_path)
    elif os.name == 'posix':
        subprocess.call(['open' if sys.platform == 'darwin' else 'xdg-open', output_path])


def browse_image():
    file_path = filedialog.askopenfilename(title="Выбери изображение", filetypes=[("Image files", "*.jpg *.png")])
    if file_path:
        image_path.set(file_path)


def process_image():
    file_path = image_path.get()
    if not file_path:
        messagebox.showwarning("Warning", "Выбери изображение.")
        return
    style = style_var.get()
    output_path = f"{style}.txt"
    try:
        save_ascii_art(file_path, output_path, style)
        messagebox.showinfo("Info", f"Арт сохранен {output_path}.")
    except ValueError as e:
        messagebox.showerror("Error", str(e))


# GUI setup
root = tk.Tk()
root.title("Рофло Фильтр фото в ASCII")

tk.Label(root, text="Путь изображения:").grid(row=0, column=0, padx=10, pady=5, sticky="e")
image_path = tk.StringVar()
tk.Entry(root, textvariable=image_path, width=50).grid(row=0, column=1, padx=10, pady=5)
tk.Button(root, text="Выбрать...", command=browse_image).grid(row=0, column=2, padx=10, pady=5)

tk.Label(root, text="Фильтр/Стиль:").grid(row=1, column=0, padx=10, pady=5, sticky="e")
style_var = tk.StringVar(value="Classic")
tk.OptionMenu(root, style_var, "Heart", "Deadinside", "Classic").grid(row=1, column=1, padx=10, pady=5, sticky="w")

tk.Button(root, text="Создать изображение", command=process_image).grid(row=2, column=0, columnspan=3, padx=10, pady=10)

root.mainloop()
