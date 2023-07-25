import numpy as np
import cv2
from scipy.ndimage import rotate

def crop(img_bgr):
    thresh = cv2.threshold(cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY), 100, 255, cv2.THRESH_TOZERO)[1]
    bb = cv2.boundingRect(thresh)
    x, y, w, h = bb
    return thresh[y:y+h, x:x+w]

def eliminate_based_on_neighbors(img, nneighbors):
    tbool = img == 0  # True if black

    height = tbool.shape[0]
    width = tbool.shape[1]

    top_left = np.pad(tbool[0:height-1, 0:width-1], ((1, 0), (1, 0)))
    top = np.pad(tbool[0:height-1, 0:width], ((1, 0), (0, 0)))
    top_right = np.pad(tbool[0:height-1, 1:width], ((1, 0), (0, 1)))
    left = np.pad(tbool[0:height, 0:width-1], ((0, 0), (1, 0)))
    right = np.pad(tbool[0:height, 1:width], ((0, 0), (0, 1)))
    bottom_left = np.pad(tbool[1:height, 0:width-1], ((0, 1), (1, 0)))
    bottom = np.pad(tbool[1:height, 0:width], ((0, 1), (0, 0)))
    bottom_right = np.pad(tbool[1:height, 1:width], ((0, 1), (0, 1)))

    stacked = np.dstack((top_left, top, top_right, left, right, bottom_left, bottom, bottom_right))

    black_neighbor_count = np.sum(stacked, axis=2)

    return black_neighbor_count * tbool < nneighbors

def pipeline(img_path):
    img_bgr = cv2.imread(img_path)
    foreground = crop(img_bgr)
    thresh = cv2.adaptiveThreshold(foreground, 255, cv2.ADAPTIVE_THRESH_MEAN_C, cv2.THRESH_BINARY, 555, 14)
    new_img = eliminate_based_on_neighbors(thresh, 8)
    new_img = eliminate_based_on_neighbors(new_img, 8)
    new_img = eliminate_based_on_neighbors(new_img, 8)
    return new_img

def to_rgb(grayscale_image):
    bool_rgb = np.repeat(grayscale_image.reshape((grayscale_image.shape[0],grayscale_image.shape[1],1)), 3, axis=2)
    numeric_rgb = bool_rgb * np.ones_like(bool_rgb, dtype=int) * 255
    return numeric_rgb

def process_plate(img_path): 
    return to_rgb(pipeline(img_path))

def find_intersection(svg_png, plate): 
    full = np.logical_and(plate, svg_png)
    full = to_rgb(full)
    
    intersection = np.logical_or(plate, svg_png)
    intersection_inv = np.logical_not(intersection)
    intersection = to_rgb(intersection)
    intersection[:, :, 2] = 255  # cv2 saves as bgr image 
    intersection = intersection_inv.reshape((intersection_inv.shape[0], intersection_inv.shape[1], 1)) * intersection
    
    combined = np.logical_or(intersection == 255, full == 255)
    combined = combined * np.ones_like(combined, dtype=int) * 255

    return intersection, combined

if __name__ == "__main__":
    img_path = "../../images/cropartlight2-f.jpg"
    landscape = rotate(process_plate(img_path), 90)
    cv2.imwrite("plate.jpg", landscape)

