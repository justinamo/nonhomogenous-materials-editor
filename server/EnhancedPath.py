from svgpathtools import *
from utils import round_complex
import itertools

class EnhancedPath:
    def __init__(self, path, attributes):
        self.path = path 
        self.attributes = attributes
    
    def get_path(self):
        return self.path

    def get_attributes(self):
        return self.attributes

    def isclosed(self):
        # svgpathtools asserts isclosed instead of returning false for some reason
        try:
            self.path.isclosed()
        except AssertionError:
            return False

    def iscontinuous(self):
        return self.path.iscontinuous()

    def point(self, T): 
        return self.path.point(T)

    def bbox(self): 
        return self.path.bbox()

    def write_svg(self, filename, **kwargs):
        wsvg(self.path, attributes=self.attributes, filename=filename, **kwargs)

    def points(self): 
        points = []
        for segment in self.path: 
            points.append(segment.point(0))
        return points
    
    def segments(self):
        return [EnhancedPath(Path(segment), self.attributes) for segment in self.path]

    def reversed(self):
        self.path = self.path.reversed()
        return self


accuracy = 0

class GroupedPath: 
    def __init__(self, enhanced_paths): 
        raw_paths = map(lambda x: x.get_path(), enhanced_paths)
        segments = []
        for path in raw_paths:
            for segment in path: 
                segments.append(segment)
        self.unified_path = Path(*segments)
        self.enhanced_paths = enhanced_paths

    def points(self):
        points = map(lambda x: x.points(), self.enhanced_paths)
        return list(itertools.chain(*points))

    def bbox(self): 
        return self.unified_path.bbox()

    def _reverse_order(by_start, start_point): 
        path, raw_end = by_start[start_point]
        end = round_complex(raw_end, accuracy)
        print(start_point, end)
        print(path) 
        if end in by_start and not start_point == end: 
            print("going in" + str(end))
            GroupedPath._reverse_order(by_start, end)
            print("going out")
        by_start[end] = path.reversed(), start_point
        print("leaving" + str(end))
        del by_start[start_point]

    def find_closed(self): 
        by_start = {}
        ordered = [self.enhanced_paths[0]]
        for path in self.enhanced_paths: 
            start = round_complex(path.point(0), accuracy)
            end = round_complex(path.point(1), accuracy)
            print(start, end)
            if start in by_start:
                print("reversing" + str(start))
                GroupedPath._reverse_order(by_start, start) 
            by_start[start] = (path, end)
            print("finishing" + str(start))
            print(path)
            print("finished")

        i = 0
        while len(ordered) < len(by_start):
            try: 
                print(i)
                end = ordered[i].point(1)
                ordered.append(by_start[round_complex(end, accuracy)][0])
                i += 1
            except KeyError: 
                print (by_start[round_complex(end, accuracy)])
                raise Exception("KeyError on key: " + str(end))

        return GroupedPath(ordered)

    def write_svg(self, filename, **kwargs):
        paths = list(map(lambda x: x.get_path(), self.enhanced_paths))
        attributes = list(map(lambda x: x.get_attributes(), self.enhanced_paths))
        wsvg(paths, attributes=attributes, filename=filename, **kwargs)

    def isclosed(self): 
        return self.unified_path.isclosed()

def consolidate_to_grouped(enhanced_paths_and_grouped_paths):
    paths = []
    for path in enhanced_paths_and_grouped_paths: 
        if isinstance(path, EnhancedPath):
            paths.append(path)
        elif isinstance(path, GroupedPath):
            paths += path.enhanced_paths

    return GroupedPath(paths)

to_preserve = [ "transform",
                "fill",
                "stroke",
                "stroke-width",
                "stroke-linecap",
                "stroke-linejoin",
                "stroke-miterlimit",
              ]

default_values = { "fill": "none",
                   "stroke": "#ff0000",
                   "stroke-width": 0.5,
                   "stroke-linecap": "round",
                   "stroke-linejoin": "round",
                   "stroke-miterlimit": 10
                 }

def read_svg(file): 
    paths, raw_attributes_per_path, svg_attributes = svg2paths(file, return_svg_attributes=True)
    attributes_per_path = []
    for raw_attributes in raw_attributes_per_path:
        attributes = {}
        for attr in raw_attributes: 
            if attr in to_preserve:
                attributes[attr] = raw_attributes[attr]
        for attr_name in default_values:
            if attr_name not in attributes: 
                attributes[attr_name] = default_values[attr_name]
        attributes_per_path.append(attributes)
    e_paths = []
    for p, attr in zip(paths, attributes_per_path): 
        e_paths.append(EnhancedPath(p, attr))
    return e_paths, svg_attributes["viewBox"]


