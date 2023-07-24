from pprint import pprint
from functools import reduce
from EnhancedPath import * 
from utils import round_complex
import sys
import cairosvg

def endpoints(paths):
    closed_paths = []
    endpoints_and_paths = []
    for path in paths: 
        if path.isclosed(): 
            closed_paths.append(path)
        elif path.iscontinuous(): 
            start = path.point(0)
            end = path.point(1)
            path_info = (start, end, path)
            endpoints_and_paths.append(path_info)
        else:
            for segment in path.segments(): 
                start = segment.point(0)
                end = segment.point(1)
                endpoints_and_paths.append((start, end, segment))
    return closed_paths, endpoints_and_paths

def match(endpoints_and_paths): 

    cc = []  # continuous cuts
    points_to_cc_idx = {}
        
    for (start, end, path) in endpoints_and_paths: 
        start = round_complex(start, 0)
        end = round_complex(end, 0)
        if start in points_to_cc_idx and end in points_to_cc_idx:
            spoint_cut_idx = points_to_cc_idx[start]
            epoint_cut_idx = points_to_cc_idx[end]
            if spoint_cut_idx != epoint_cut_idx:
                cc[spoint_cut_idx] = cc[spoint_cut_idx] + cc[epoint_cut_idx]
                del cc[epoint_cut_idx]
                if spoint_cut_idx > epoint_cut_idx: 
                    spoint_cut_idx -= 1
                for point in points_to_cc_idx:
                    if points_to_cc_idx[point] > epoint_cut_idx: 
                        points_to_cc_idx[point] -= 1
                    elif points_to_cc_idx[point] == epoint_cut_idx:
                        points_to_cc_idx[point] = spoint_cut_idx
            cc[spoint_cut_idx].append(path)
        elif start in points_to_cc_idx: 
            cc[points_to_cc_idx[start]].append(path)
            points_to_cc_idx[end] = points_to_cc_idx[start]
        elif end in points_to_cc_idx: 
            cc[points_to_cc_idx[end]].append(path)
            points_to_cc_idx[start] = points_to_cc_idx[end]
        else:
            new_cut_idx = len(cc)
            cc.append([path])
            points_to_cc_idx[start] = new_cut_idx
            points_to_cc_idx[end] = new_cut_idx

    return list(map(lambda x: GroupedPath(x), cc))


def is_contained_by_other(bbox, other_bbox):
    xmin, xmax, ymin, ymax = bbox
    oxmin, oxmax, oymin, oymax = other_bbox
    return oxmin < xmin and oxmax > xmax and oymin < ymin and oymax > ymax

def find_outer_cuts(cuts):
    outer_cuts = [] 
    bboxes = list(map(lambda x: (x, x.bbox()), cuts))
    for path, bbox in bboxes: 
        is_inner_cut = False
        for _, other in bboxes: 
            if is_contained_by_other(bbox, other):
                is_inner_cut = True
        if not is_inner_cut:
            outer_cuts.append(path)

    return outer_cuts


def group_parts(cuts):

    oc = find_outer_cuts(cuts)
    outer_and_inner = {}

    for cut in oc:
        outer_and_inner[cut] = [cut]

    bboxes = list(map(lambda x: (x, x.bbox()), cuts))
    ambiguous = {}

    for path, bbox in bboxes:
        belongs_to = None
        for outer in outer_and_inner.keys(): 
            if is_contained_by_other(bbox, outer.bbox()):
                if belongs_to is not None:
                    if path in ambiguous: 
                        ambiguous[path].append(outer)
                    else: 
                        ambiguous[path] = [belongs_to, outer]
                        outer_and_inner[belongs_to].remove(path)
                else: 
                    outer_and_inner[outer].append(path)
                    belongs_to = outer

    ambiguous_without_outer_cut = [] 

    for path in ambiguous: 
        xmin, xmax, ymin, ymax = path.bbox()
        correct_outer_cut = None
        for outer_cut in ambiguous[path]:
            outer_bbox = outer_cut.bbox()
            points = outer_cut.points()
            q1 = False
            q2 = False
            q3 = False
            q4 = False
            for point in points: 
                px = point.real
                py = point.imag
                if px < xmin and py < ymin: 
                    q1 = True
                if px < xmin and py > ymax:
                    q2 = True
                if px > xmax and py > ymax:
                    q3 = True
                if px > xmax and py < ymin: 
                    q4 = True
            if q1 and q2 and q3 and q4: 
                if correct_outer_cut is not None: 
                    raise "Path " + str(path) + " belongs to two outer cuts. This should not happen."
                correct_outer_cut = outer_cut
        if correct_outer_cut is None: 
            ambiguous_without_outer_cut.append(path)
        else: 
            outer_and_inner[correct_outer_cut].append(path)
    
    if len(ambiguous_without_outer_cut) == 1:
        outer_and_inner[ambiguous_without_outer_cut[0]] = [ambiguous_without_outer_cut[0]]
    elif len(ambiguous_without_outer_cut) > 1:
        new_outer_and_inner = group_parts(ambiguous_without_outer_cut)
        outer_and_inner = {**outer_and_inner, **new_outer_and_inner}

    return list(map(consolidate_to_grouped, outer_and_inner.values()))


if __name__ == "__main__":
    file = sys.argv[1]
    paths, viewbox = read_svg(file)

    print(viewbox)
    viewbox = "234.96510000000004 212.7351 371.06979999999993 166.02980000000002"

    pixels_per_inch_photo = 214
    svg_dpi = 90 

    consolidate_to_grouped(paths).write_svg(filename="output.svg", viewbox=viewbox)
    
    cairosvg.svg2png(url="output.svg", write_to="output.png", output_height=2568, output_width=4032)

    closed_paths, endpoints_and_paths = endpoints(paths)
    parts = match(endpoints_and_paths)
    grouped = group_parts(closed_paths + parts)

    closed_paths2 = map(lambda x: x.find_closed(), parts)
    for path in closed_paths2: 
        print(path.isclosed())

    i = 0
    output_files = []
    for path in grouped: 
        filename = "output" + str(i) + ".svg"
        path.write_svg(filename=filename, viewbox=viewbox)
        output_files.append(filename)
        i += 1

    for file in output_files: 
        cairosvg.svg2png(url=file, write_to=file + ".png", output_height=2568, output_width=4032)

